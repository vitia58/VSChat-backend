import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from 'src/models/Chat';
import { Session, SessionDocument } from 'src/models/Session';
import { SocketGateway } from './socket.gateway';
import { UserService } from 'src/user/user.service';
import { CChatResponse } from 'src/chat/dto/CChatResponse';

@Injectable()
export class SocketRouter {
    constructor(//@InjectModel(User.name) private readonly userModel:Model<UserDocument>,
    @InjectModel(Session.name) private readonly sessionModel:Model<SessionDocument>,
    @InjectModel(Chat.name) private readonly chatModel:Model<ChatDocument>,
    @Inject(forwardRef(() => SocketGateway))
    private readonly socketGateway: SocketGateway,
    private readonly userService: UserService,
    ){}
    
    async sendToSessions<T extends keyof EventDataType>(sessions:SessionDocument[],event:T,data:EventDataType[T]){
      let is = false;
      for (const session of sessions) {
        if(session){
          const con = this.socketGateway.connections.get(session._id+"");
          if(con){
            this.socketGateway.send(con,event,data)
            is=true
          }else{
            await this.addWithCompress(session,JSON.stringify({event,data}))
          }
        }
      }
      return is
    }

    private async getSessions(userID:string){
      return this.sessionModel.find({user:userID}).exec()
    }

    async sendToUser<T extends keyof EventDataType>(user:string,event:T,data:EventDataType[T]){
      const sessions = await this.getSessions(user)
      return await this.sendToSessions(sessions,event,data)
    }

    async sendToChatById<T extends keyof EventDataType>(chatId:string,filter:any,event:T,data:EventDataType[T]){
      const chat = await this.chatModel.findById(chatId).exec()
      await this.sendToChat(chat,filter,event,data)
      return chat
    }

    userFilter(userID:string){
      return (u:string)=>userID!=u
    }

    async sendToChat<T extends keyof EventDataType>(chat:Chat,filter:(u:string)=>boolean|Promise<boolean>,event:T,data:EventDataType[T]){
      if(chat){
        await Promise.all(chat.users.map(u=>u+"").filter(filter||(()=>true)).map(user=>
          this.sendToUser(user+"",event,data)
        ))
      }
    }

    async sendToChatWithAccess<T extends keyof EventDataType>(chat:Chat,event:T,publicData:(u:string)=>Promise<any>,userOwner:string,privateData:any){
      if(chat){
        await Promise.all(chat.users.map(u=>u+"").map(async user=>{
          const public1 = await publicData(user)
          await this.sendToUser(
            user,
            event,
            user==userOwner
              ?{...public1,...privateData}
              :public1
          )
        }))
      }
      return chat
    }

    async sendToUsers<T extends keyof EventDataType>(users:string[]|Set<string>,event:T,data:EventDataType[T]){
      await Promise.all([...users].map((u:string)=>
        this.sendToUser(u,event,data)
      ))
    }
    
    async sendToAllRelatedUsers<T extends keyof EventDataType>(userId:string,event:T,data:EventDataType[T]){
      const send = await this.userService.getRelatedUsers(userId)
      await this.sendToUsers(send,event,data)
    }

    async sendToUserWithFilter<T extends keyof EventDataType>(userId:string,filter:(session:SessionDocument)=>Promise<boolean>,event:T,data:EventDataType[T]){
      const sessions = await this.getSessions(userId)
      const filteredSessions = await Promise.all(sessions.filter(filter))
      await this.sendToSessions(filteredSessions,event,data)
    }

    async logout(sessionId:string){
      const socket = this.socketGateway.connections.get(sessionId)
      this.socketGateway.send(socket,"Logout",{})
      if(socket)socket.close()
    }
    private async addWithCompress(session:SessionDocument,data:string){
      const {deliverySocketBuffer} = session
      const obj = [
        {
          NewUser:{},
          NewChat:{},
          NewMessage:{},
          UpdateMessage:{},
          UpdateUser:{},
          UpdateChat:{},
          RemoveMessage:{},
          RemoveUser:{},
          RemoveChat:{},
          RemovePush:{}
        },...(deliverySocketBuffer??[]),data]
      .reduce((p:{
        NewUser: {};
        NewChat: {};
        NewMessage: {};
        UpdateMessage: {};
        UpdateUser: {};
        UpdateChat: {};
        RemoveMessage: {};
        RemoveUser: {};
        RemoveChat: {};
        RemovePush: {};
      },c:string)=>{
        const {event,data:{id,_id,...params}}:{event:keyof EventDataType,data:any} = JSON.parse(c)
        if(event=="RemovePush")return {...p,RemovePush:{...p.RemovePush,[id]:{}}}
        // if(!["UpdateMessage","UpdateUser","UpdateChat"].includes(event))return p
        if(event.startsWith("New")){
          return {...p,[event]:{...p[event],[event=="NewUser"?_id:id]:params}}
        }
        if(event.startsWith("Update")){
          const n = event.replace("Update","New")
          if(p[n][id]){
            return {...p,[n]:{...p[n],[id]:{...(p[n][id]??{}),...params}}}
          }else return {...p,[event]:{...p[event],[id]:params}}
        }
        if(event.startsWith("Remove")){
          const newEvent = event.replace("Remove","New")
          if(p[newEvent][id]){
            return {...p,[newEvent]:{...p[newEvent],[id]:undefined}}
          }
          const updateEvent = event.replace("Remove","Update")
          if(p[updateEvent][id]){
            return {...p,[updateEvent]:{...p[updateEvent],[id]:undefined}}
          }
          return {...p,[event]:{...p[event],[id]:{}}}
        }
      })
      const update = Object.keys(obj).map(event=>
        Object.keys(obj[event]).map(k=>{
          const data = {event,data:{[event=="NewUser"?"_id":"id"]:k,...obj[event][k]}}
          return JSON.stringify(data)
        })
      ).reduce((p,c)=>[...p,...c])
      await session.updateOne({deliverySocketBuffer:update}).exec()
    }
}

type EventDataType = {
  NewMessage:CMessageResponse
  UpdateMessage:{[K in keyof CMessageResponse]?:CMessageResponse[K]}&{id:string,chat:string}
  RemoveMessage:{id:string,chat:string}
  
  NewUser:CUserResponse
  UpdateUser:{[K in keyof CUserResponse]?:CUserResponse[K]}&{id:string}
  RemoveUser:{id:string}

  NewChat:CChatResponse
  UpdateChat:{[K in keyof CChatResponse]?:CChatResponse[K]}&{id:string}
  RemoveChat:{id:string}

  RemovePush:{id:string}
}
