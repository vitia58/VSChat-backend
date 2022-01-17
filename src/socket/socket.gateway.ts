import { BeforeApplicationShutdown, forwardRef, Inject, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { isJSON } from 'class-validator';
import { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { __DEV__ } from 'src/helpers/constant';
import { Chat, ChatDocument } from 'src/models/Chat';
import { Session, SessionDocument } from 'src/models/Session';
import { User, UserDocument } from 'src/models/User';
import { SessionsService } from 'src/sessions/sessions.service';
import { TransformersService } from 'src/transformers/transformers.service';
import WebSocket, { Server } from 'ws';
import { SocketRouter } from './socket.router';
@WebSocketGateway(__DEV__?8080:undefined)
export class SocketGateway implements OnGatewayConnection,OnGatewayInit,OnModuleDestroy {
  constructor(@InjectModel(User.name) private readonly userModel:Model<UserDocument>,
  @InjectModel(Session.name) private readonly sessionModel:Model<SessionDocument>,
  @InjectModel(Chat.name) private readonly chatModel:Model<ChatDocument>,
  private readonly authService:AuthService,
  private readonly sessionService:SessionsService,
  @Inject(forwardRef(() => SocketRouter))
  private readonly socketRouter: SocketRouter,
  private readonly transformers:TransformersService){}
  // async beforeApplicationShutdown() {
  //   await this.sessionModel.updateMany({},{online:false,lastOnline:new Date().getTime()},{new:true}).exec()
  // }
  async onModuleDestroy(){
    await this.sessionModel.updateMany({_id:{$in:[...this.connections.keys()]}},{online:false,lastOnline:new Date().getTime()},{new:true})
  }
  async afterInit(server: any) {
    if(!__DEV__){
      // await this.sessionModel.updateMany({},{online:false,lastOnline:new Date().getTime()},{new:true}).exec()
      // this.userModel.updateMany({},{online:0},{new:true}).exec()
      // this.sessionModel.updateMany({_id:{$in:[...this.connections.keys()]}})

    }
  }

  connections:Map<string,WebSocket> = new Map()
  handleConnection(client: WebSocket) {
    client.onmessage = async ({data})=>{
      const sessionData = await this.authService.decript(data.toString())
      // console.log(sessionData)
      const id = sessionData["id"]
      const session = await this.sessionModel.findById(id).exec()
      if(session){
        client.onmessage = this.getClientEvents(session.user+"",id)
        client.onclose = await this.onlineListener(session.user,id)
        const last = this.connections.get(id)
        if(last)last.close()
        this.connections.set(id,client)
        this.send(client,"Authorized",id)
        if(!__DEV__){
          setInterval(()=>{
            this.send(client,"1","1")
          },50000)
        }
        this.sendNews(session,client)
        // console.log(id)
      }else{
        this.send(client,"Unauthorized","error")
        client.close()
      }
    }
  }

  private async onlineListener(user:string,sessionId:string){
    const conUser = await this.transformers.userTransformById(user)
    if(conUser.online!==true){
      await this.sessionModel.findByIdAndUpdate(sessionId,{online:true})
      this.socketRouter.sendToAllRelatedUsers(user,"UpdateUser",{id:user+"",online:true})
    }
    return async ()=>{
      this.connections.delete(sessionId)
      const lastOnline = new Date().getTime()

      const openedChats = await this.chatModel.find({opened:{$in:[sessionId]}}).exec()
      openedChats.forEach(async (chat:ChatDocument)=>{
        this.changeChatOptions("opened","remove",chat,sessionId,user)
      })

      const typpingChats = await this.chatModel.find({typping:{$in:[sessionId]}}).exec()
      typpingChats.forEach(async (chat:ChatDocument)=>{
        this.changeChatOptions("typping","remove",chat,sessionId,user)
      })

      await this.sessionModel.findByIdAndUpdate(sessionId,{lastOnline,online:false})
      const disconUser = await this.transformers.userTransformById(user)
      // console.log(disconUser.online)
      if(disconUser.online!==true){
        this.socketRouter.sendToAllRelatedUsers(user,"UpdateUser",{id:user+"",online:lastOnline})
      }
    }
  }

  private async sendNews(session:SessionDocument,connection:WebSocket){
    await session.updateOne({deliverySocketBuffer:[]}).exec()
    const {deliverySocketBuffer} = session
    deliverySocketBuffer.forEach(m=>{
      connection.send(m)
    })
  }

  private getClientEvents(userId:string,sessionId:string){
    let lastTypping:{chat:string,time:number} = {chat:null,time:0}

    const getChat = (chatId:string)=> this.chatModel.findById(chatId).exec()

    return async ({data}) => {
      if (data&&isJSON(data)) {
        const event:{event:string,data:any} = JSON.parse(data)
        // console.log(event)
        // const session = await this.sessionModel.findById(sessionId).exec()
        switch (event.event) {
          case "Typping":
          case "ChatOpen":
          case "ChatClose":{
            event.data = await getChat(event.data+"")
            if(!(event.data && event.data.users.find((u)=>userId==u+"")))break    //CHAT ACCESS FILTER
          }
        }
        switch (event.event) {
          case "Typping":{
            const chat:ChatDocument = event.data
            const chatId:string = chat._id+""
            const lT = lastTypping.time = new Date().getTime()
            if(chatId!=lastTypping.chat){
              await this.changeChatOptions("typping","add",chat,sessionId,userId)
            }
            setTimeout(async () => {
              if(lT==lastTypping.time||chatId!=lastTypping.chat){
                await this.changeChatOptions("typping","remove",chat,sessionId,userId)
              }
            }, 5000);
            lastTypping.chat=chatId
            break;
          }case "ChatOpen":{
            await this.changeChatOptions("opened","add",event.data,sessionId,userId)
            break;
          }case "ChatClose":{
            await this.changeChatOptions("opened","remove",event.data,sessionId,userId)
            break;
          }
          default:
            break;
        }
      }
    }
  }

  private async changeChatOptions(fieldName:"opened"|"typping",type:"add"|"remove",chat:ChatDocument|null,sessionId:string,userId:string){
    if(chat){
      const last = chat[fieldName].filter(s=>s.length>0)
      const field = (type=="add"
        ?[...new Set([...last,sessionId])]
        :this.removeFromArray([...last],sessionId))
      if(field.length!=last.length){
        this.socketRouter.sendToChat(chat,this.socketRouter.userFilter(userId),"UpdateChat",{id:chat._id+"",[fieldName]:await this.transformers.getUsersFromSessions(field)})
        await this.chatModel.findByIdAndUpdate(chat._id,{[fieldName]:field},{new:true})
      }
    }
  }

  send(client:WebSocket,event:string,data:any){
    client.send(JSON.stringify({event,data}))
  }

  private removeFromArray<T>(array:T[],value:T){
    const index = array.indexOf(value);
    if (index > -1)
      array.splice(index, 1);
    return array;
  }

  @WebSocketServer()
  private server: Server;
}
