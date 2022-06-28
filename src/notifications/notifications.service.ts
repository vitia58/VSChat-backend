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
import { FILES_URL } from 'src/helpers/constant';
import { SocketRouter } from 'src/socket/socket.router';
import { Notification, NotificationDocument } from 'src/models/Notification';

@Injectable()
export class NotificationsService {
    constructor(
        private readonly oneSignalService: OneSignalService,
        @InjectModel(Chat.name) private readonly chatModel:Model<ChatDocument>,
        @InjectModel(Session.name) private readonly sessionModel:Model<SessionDocument>,
        @InjectModel(Message.name) private readonly messageModel:Model<MessageDocument>,
        @InjectModel(Notification.name) private readonly notificationModel:Model<NotificationDocument>,
        @Inject(forwardRef(() => ChatService))
        private readonly chatSevice: ChatService,
        private readonly userService: UserService,
        private readonly socket: SocketRouter,
    ){}
    async sendToChat(messageId:string){
        const message = await this.messageModel.findById(messageId).exec()
        const chat = await this.chatModel.findById(message.chat)
        // console.log(message)
        for (const u of chat.users.filter(e=>e._id+""!=message.user+"")) {
            const uid = u._id+""
            if(!await this.userService.checkIsChatOpened(uid,chat._id+"")&&!chat.muted.some(m=>m==uid))
                await this.sendMessagePush(message,uid)
        }
    }
    async sendMessagePush(message:Message,userid:string){
        console.log(message._id,userid)
        const sessions = await this.sessionModel.find({user:userid}).exec()
        const list = sessions.map(s=>s.oneSignal).filter(e=>e)
        const def = await this.chatSevice.generateChatDefaults(message.chat,userid)
        const body:CNotificationBodyDTO = {
            title:def.title,
            message:message.message||message.fileType||"Сообщение",
            image:def.image,
            bigImage:message.fileType=="image"?`${FILES_URL}/${message.file[0]}`:undefined
        }
        const data = {
            type:"Open chat",
            data:message.chat
        }
        console.log(list,body,data)
        const notificationId = await this.sendPush(list,body,data)
        await new this.notificationModel({notificationId,sessions:sessions.map(e=>e._id+""),messageId:message._id+""}).save()
    }
    async sendPush(userIds:Array<string>,body:CNotificationBodyDTO,data:any){
        if(userIds.length>0){
            const message = new NotificationByDeviceBuilder()
                .setIncludePlayerIds(userIds)
                .notification()
                .setHeadings({en:body.title})
                .setContents({en:body.message})
                .setAttachments({data,...(body.bigImage?{big_picture:body.bigImage}:{})})
                .setAppearance({
                    large_icon:body.image,
                    adm_large_icon:body.image,
                })
                .setContentAvailable(false)
                .build()
            const push = await this.oneSignalService.createNotification(message)
            //@ts-ignore
            push.errors&&this.logoutSessions(push.errors.invalid_player_ids)
            return push.id;
        }else return null
    }
    async logoutSessions(list:string[]){
        await this.sessionModel.deleteMany({oneSignal:{$in:list}}).exec()
    }
    async clearPushForMessage(messageId:string){
        const notifications = await this.notificationModel.find({messageId})
        if(!NotificationsService)return;
        for(const notification of notifications){
            const {sessions,notificationId} = notification
            const list = await Promise.all(sessions.map(id=>this.sessionModel.findById(id)))
            await this.socket.sendToSessions(list,"RemovePush",{id:notificationId})
            notification.delete()
        }
    }
    async setOneSignal(oneSignalDTO:CSetOnesignalDTO, user: CUserDTO){
        await this.sessionModel.deleteMany({oneSignal:oneSignalDTO.oneSignal,_id:{$ne:user.session._id}}).exec()
        await this.sessionModel.findByIdAndUpdate(user.session._id,{oneSignal:oneSignalDTO.oneSignal},{new:true}).exec()
    }
}
