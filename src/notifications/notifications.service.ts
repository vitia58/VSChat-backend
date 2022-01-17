import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { OneSignalService } from 'onesignal-api-client-nest';
import { NotificationByDeviceBuilder } from 'onesignal-api-client-core';
import { CNotificationBodyDTO } from './dto/CNotificationBodyDTO';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, ChatDocument } from 'src/models/Chat';
import { Model } from 'mongoose';
import { Session, SessionDocument } from 'src/models/Session';
import { Message, MessageDocument } from 'src/models/Message';
import { User, UserDocument } from 'src/models/User';
import { ChatService } from 'src/chat/chat.service';
import { CSetOnesignalDTO } from './dto/CSetOnesignalDTO';
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import { UserService } from 'src/user/user.service';

@Injectable()
export class NotificationsService {
    constructor(
        private readonly oneSignalService: OneSignalService,
        @InjectModel(Chat.name) private readonly chatModel:Model<ChatDocument>,
        @InjectModel(Session.name) private readonly sessionModel:Model<SessionDocument>,
        @InjectModel(Message.name) private readonly messageModel:Model<MessageDocument>,
        @Inject(forwardRef(() => ChatService))
        private readonly chatSevice: ChatService,
        private readonly userService: UserService,
    ){}
    async sendToChat(messageId:string){
        const message = await this.messageModel.findById(messageId).exec()
        const chat = await this.chatModel.findById(message.chat)
        // console.log(message)
        for (const u of chat.users.filter(e=>e._id+""!=message.user+"")) {
            const uid = u._id+""
            if(!await this.userService.checkIsChatOpened(uid,chat._id+"")&&!chat.muted.some(m=>m==uid))
                this.sendMessagePush(messageId,uid)
        }
    }
    async sendMessagePush(messageId:string,userid:string){
        console.log(messageId,userid)
        const sessions = await this.sessionModel.find({user:userid}).exec()
        const message = await this.messageModel.findById(messageId).exec()
        const list = sessions.map(s=>s.oneSignal).filter(e=>e)
        const def = await this.chatSevice.generateChatDefaults(message.chat,userid)
        const body:CNotificationBodyDTO = {
            title:def.title,
            message:message.message,
            image:def.image
        }
        const data = {
            type:"Open chat",
            data:message.chat
        }
        console.log(list,body,data)
        return await this.sendPush(list,body,data)
    }
    async sendPush(userIds:Array<string>,body:CNotificationBodyDTO,data:any){
        if(userIds.length>0){
            const message = new NotificationByDeviceBuilder()
                .setIncludePlayerIds(userIds)
                .notification()
                .setHeadings({en:body.title})
                .setContents({en:body.message})
                .setAttachments({data})
                .setAppearance({
                    large_icon:body.image,
                    adm_large_icon:body.image,
                })
                .build()
            const push = await this.oneSignalService.createNotification(message)
            // console.log(push.errors)
            return push.id;
        }else return null
    }
    async setOneSignal(oneSignalDTO:CSetOnesignalDTO, user: CUserDTO){
        await this.sessionModel.findByIdAndUpdate(user.session._id,{oneSignal:oneSignalDTO.oneSignal},{new:true}).exec()
    }
}
