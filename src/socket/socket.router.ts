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
    
    async sendToSessions<T extends keyof EventDataType>(sessions:string[],event:T,data:EventDataType[T]){
      let is = false;
      for (const session of sessions) {
        const con = this.socketGateway.connections.get(session);
        if(con){
          this.socketGateway.send(con,event,data)
          is=true
        }else{
          const s = await this.sessionModel.findById(session).exec()
          await s.updateOne({deliverySocketBuffer:[...s.deliverySocketBuffer,JSON.stringify({event,data})]}).exec()
        }
      }
      return is
    }

    private async getSessions(userID:string){
      return await this.sessionModel.find({user:userID}).exec()
    }

    async sendToUser<T extends keyof EventDataType>(user:string,event:T,data:EventDataType[T]){
      const sessions = await this.getSessions(user)
      return this.sendToSessions(sessions.map(s=>s.id+""),event,data)
    }

    async sendToChatById<T extends keyof EventDataType>(chatId:string,filter:any,event:T,data:EventDataType[T]){
      const chat = await this.chatModel.findById(chatId).exec()
      this.sendToChat(chat,filter,event,data)
      return chat
    }

    userFilter(userID:string){
      return (u:string)=>userID!=u
    }

    sendToChat<T extends keyof EventDataType>(chat:Chat,filter:(u:string)=>boolean|Promise<boolean>,event:T,data:EventDataType[T]){
      if(chat){
        chat.users.map(u=>u+"").filter(filter||(()=>true)).forEach(user=>{
            this.sendToUser(user+"",event,data)
        })
      }
    }

    async sendToChatWithAccess<T extends keyof EventDataType>(chat:Chat,event:T,publicData:(u:string)=>Promise<any>,userOwner:string,privateData:any){
      if(chat){
        chat.users.map(u=>u+"").forEach(async user=>{
          const public1 = await publicData(user)
          this.sendToUser(
            user,
            event,
            user==userOwner
              ?{...public1,...privateData}
              :public1
          )
        })
      }
      return chat
    }

    sendToUsers<T extends keyof EventDataType>(users:string[]|Set<string>,event:T,data:EventDataType[T]){
      users.forEach((u:string)=>
        this.sendToUser(u,event,data)
      )
    }
    
    async sendToAllRelatedUsers<T extends keyof EventDataType>(userId:string,event:T,data:EventDataType[T]){
      const send = await this.userService.getRelatedUsers(userId)
      this.sendToUsers(send,event,data)
    }

    async sendToUserWithFilter<T extends keyof EventDataType>(userId:string,filter:(session:SessionDocument)=>Promise<boolean>,event:T,data:EventDataType[T]){
      const sessions = await this.getSessions(userId)
      const filteredSessions = await Promise.all(sessions.filter(filter))
      this.sendToSessions(filteredSessions.map((v)=>v._id),event,data)
    }

    async logout(sessionId:string){
      const socket = this.socketGateway.connections.get(sessionId)
      this.socketGateway.send(socket,"Logout",{})
      socket.close()
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
}
