import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Types } from 'mongoose';
import { Chat, ChatDocument } from 'src/models/Chat';
import { Message, MessageDocument } from 'src/models/Message';
import { User } from 'src/models/User';
import { CCreateChatDTO } from './dto/CCreateChatDTO';
import { CSendMessageDTO } from './dto/CSendMessageDTO';
import { SocketRouter } from 'src/socket/socket.router';
import { DocumentsService } from 'src/documents/documents.service';
import { __DEV__ } from 'src/helpers/constant';
import { UserService } from 'src/user/user.service';
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import { SessionsService } from 'src/sessions/sessions.service';
import { CCreateChatWithUserDTO } from './dto/CCreateChatWithUserDTO';
import { NotificationsService } from 'src/notifications/notifications.service';
import { TransformersService } from 'src/transformers/transformers.service';
import { CAddUserToChatDTO } from './dto/CAddUserToChatDTO';
import { CChatActionDTO } from './dto/CChatActionDTO';
import { Session, SessionDocument } from 'src/models/Session';
import { CChatResponse } from './dto/CChatResponse';
import { ChatRolesService } from 'src/chat-roles/chat-roles.service';
import { CChatRoles } from 'src/chat-roles/dto/CChatRoles';
import { CRole } from 'src/chat-roles/dto/CRoles';
import { CRemoveUserToChatDTO } from './dto/CRemoveUserToChatDTO';
import { CDeleteMessageDTO } from './dto/CDeleteMessageDTO';
import { CChangeMessageDTO } from './dto/CChangeMessageDTO';
import { CDeleteChatDTO } from './dto/CDeleteChatDTO';
import { use } from 'passport';
import * as mine from 'mime-types'
import { CUploadFileDTO } from './dto/CUploadFileDTO';
import { File, FileDocument } from 'src/models/File';
import { ChatAccess } from './chat.guard';
import { runThreads } from 'src/helpers/other.helper';

@Injectable()
export class ChatService {
    constructor(
        private readonly sockets: SocketRouter,
        // private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly sessionService: SessionsService,
        @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
        @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
        @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
        @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
        private readonly documents: DocumentsService,
        @Inject(forwardRef(() => NotificationsService))
        private readonly notifications: NotificationsService,
        private readonly transformer:TransformersService,
        private readonly roles:ChatRolesService,
        ) { }
    private readonly logger = new Logger(ChatService.name);

    async send(sendMessage: CSendMessageDTO, user: CUserDTO) {
        // console.log(sendMessage,user)
        const {chat,message,reply,files,sendId} = sendMessage

        if(!message&&!files) throw new BadRequestException("Write a message text");
        if(reply&&!await this.messageModel.exists({chat:chat._id,_id:reply,shown:{$ne:false}})) throw new BadRequestException("Reply message not found");

        
        const {time,mapedFiles} = await runThreads<{time:number,mapedFiles:string[]}>(
            async ()=>{
                let time = new Date().getTime();
                while (await this.messageModel.findOne({ time, chat: chat._id }).exec()) time++;
                return {time}
            },
            async ()=>{
                const files1 = await Promise.all((files??[]).map(async file=>await this.fileModel.findById(file).exec()))
                const fileObjects = files1.map(e=>e.toObject<File>())
                const mapedFiles = fileObjects.map(file=>file.path)
                files1.forEach(file=>file.deleteOne())
                return {mapedFiles}
            },
        )

        const m = await new this.messageModel({ user: user.id, message ,chat:chat._id,reply, time,file:mapedFiles,fileType:mapedFiles.length>0?"image":null }).save()

        await runThreads(
            async ()=>{
                await this.sockets.sendToChatWithAccess(
                    chat,
                    "NewMessage",
                    async ()=>({...m.toObject(),readedBy:undefined,_id:undefined,id:m._id+""}),
                    user.id,
                    {sendId,...this.readedByTransform(user.id,m)}
                    )
                
                const showChatCommon = {
                    users:await this.roles.getChatRoles(chat),
                }
                for (const cu in chat.users.map(u=>u+"").filter(u=>!chat.shownFor.some(s=>s==u))) {
                    if(!chat.shownFor.some(u=>u==cu)){
                        this.sockets.sendToUser(cu,"NewChat",await this.transformer.chatTransform({
                            ...chat.toObject(),
                            ...await this.generateChatDefaults(chat._id+"",cu),
                            unreaded: await this.getUnreadedAmount(chat._id+"",cu),
                            lastMessage:this.transformer.messageTransform(m.toObject(),cu),
                            ...showChatCommon,
                        },cu))
                    }
                }
        
                await this.sockets.sendToChatWithAccess(
                    chat,
                    "UpdateChat",
                    async (u:string)=>({id:chat._id,lastMessage: {...m.toObject(),readedBy:undefined,_id:undefined,id:m._id+""},unreaded:await this.getUnreadedAmount(chat._id,u)}),
                    user.id,
                    {lastMessage: {...m.toObject(),...this.readedByTransform(user.id,m),_id:undefined,id:m._id+""}}
                )
            },
            async ()=>{
                await chat.updateOne({shownFor:chat.users.map(e=>e+"")}).exec()

                await this.notifications.sendToChat(m.id)
        
                await Promise.all(chat.users.map(u=>u+"").filter(u=>u!=user.id).map(async (u:string)=>{
                    if(await this.userService.checkIsChatOpened(u,chat._id))await this.readMessage(m,u)
                }))

                chat.updateOne({ lastMessage: m.id + "" }).exec()
            }
        )
        
        return { result: "Message sent" }
    }
    async uploadFile(upload: CUploadFileDTO, user: CUserDTO,file: Express.Multer.File){
        const {fileType,chat:chatid} = upload
        const chat = await this.chatModel.findById(chatid)
        this.checkChatAccess(chat,user)
        console.log("uploading")
        
        const path = `chats/${chat._id}/files/${user.login}-${new Date().getTime()}.${mine.extension(file.mimetype)}`
        const {f} = await runThreads<{f:any}>(
            async ()=>{
                await this.documents.uploadFile(file,path)
                return;
            },
            async ()=>{
                const f = await new this.fileModel({path,fileType}).save()
                return {f:f._id}
            }
        )
        console.log()
        return f._id
    }
    /**
     * It creates a chat, and then sets the role of the user who created the chat to admin.
     * @param {CCreateChatDTO} chat - CCreateChatDTO
     * @param {CUserDTO} user - CUserDTO
     * @returns The return type is a Promise of CChatResponse.
     */
    async createChat(chat: CCreateChatDTO, user: CUserDTO):Promise<CChatResponse> {
        await Promise.all(chat.users.map(async u=>{
            await this.checkRelationsWithUser(user.id,u)
        }))
        const m = await new this.chatModel({ users: [user.id, ...chat.users],allUsers:[user.id, ...chat.users] }).save()

        this.roles.setRole(user.id,m._id+"","Admin","admin")

        const def = await this.generateChatDefaults(m._id, user.id)
        const users = await this.roles.getChatRoles(m)
        const res = await this.transformer.chatTransform({ ...m.toObject(), ...def,unreaded:0,users,lastMessage:null},user.id)

        this.sockets.sendToChat(m,()=>true,"NewChat",res)

        return res
    }
    /**
     * It creates a chat between two users, if it doesn't exist, and returns it.
     * @param {CCreateChatWithUserDTO} chat - CCreateChatWithUserDTO
     * @param {CUserDTO} user - CUserDTO
     * @returns The chat object
     */
    async getByUser(chat: CCreateChatWithUserDTO, user: CUserDTO):Promise<CChatResponse> {
        await this.checkRelationsWithUser(user.id,chat.user+"")
        // console.log(chat,user)
        const avaliableChat = await this.chatModel.findOne({ $or: [{ users: [user._id, chat.user] }, { users: [chat.user, user._id] }], isGroup: false })
        const m = avaliableChat ?? await new this.chatModel({ users: [user._id, chat.user],allUsers:[user.id, chat.user+""], isGroup: false }).save()
        m.updateOne({shownFor:m.users.map(e=>e+"")}).exec()
        const def = await this.generateChatDefaults(m._id,user.id)
        const users = await this.roles.getChatRoles(m)
        const message = await this.messageModel.findById(m.lastMessage)
        const res = await this.transformer.chatTransform({
            ...m.toObject(),...def,unreaded: await this.getUnreadedAmount(m._id+"",user.id),users,lastMessage:(message??false)?this.transformer.messageTransform(message.toObject(),user.id):undefined,_id:m._id+"",isGroup:false
        },user.id)
        console.log(m)
        if(!avaliableChat||m.shownFor.length!=m.users.length){
            this.sockets.sendToChat(m,u=>!avaliableChat||!m.shownFor.some(e=>e==u),"NewChat",res)
        }
        return res
    }
    /**
     * "This function returns a message object, if the message exists and is shown, and if the user has
     * access to the chat the message is in."
     * 
     * The function is called by a controller, which is called by a route
     * @param {string} messageId - string, curUser: CUserDTO
     * @param {CUserDTO} curUser - CUserDTO
     */
    async getMessage(messageId: string, curUser: CUserDTO):Promise<CMessageResponse> {
        //this.logger.log(messageId)
        const m = await this.messageModel.findById(messageId).exec()
        if (m&&m.shown) {
            const chat = await this.chatModel.findById(m.chat).exec()
            //this.checkChatAccess(chat,curUser)
            //this.readMessage(m, curUser)
            const { message, user, time,_id,file,fileType } = m.toObject()
            const msg = {
                id:_id+"",
                message,
                chat: chat.id + "",
                user,
                time,
                file,
                fileType,
                ...this.readedByTransform(curUser.id,m)}
            return msg
        } else throw new NotFoundException("Message not found")
    }
    /**
     * It gets messages from a chat, and if the message is not shown, it will be shown
     * @param {string} chatId - string, user: CUserDTO, skip: string | null, newest: string | null
     * @param {CUserDTO} user - CUserDTO
     * @param {string | null} skip - the id of the message to skip
     * @param {string | null} newest - string | null
     * @returns An array of messages.
     */
    async getChatMessages(chatId: string, user: CUserDTO, skip: number | null, newest: number | null):Promise<CMessageResponse[]> {
        // this.logger.log(offset)
        console.log(chatId,user,skip)
        const chat = await this.chatModel.findById(chatId).exec()
        //this.checkChatAccess(chat, curUser)
        const i =
            skip ?
                { time: { $lt: skip} } :
                newest ?
                    { time: { $gt: newest } } :
                    {};

        //this.logger.log({ chat: chat.id + "",...i })
        const messages: MessageDocument[] = await this.messageModel.find(
            { chat: chat.id + "", ...i,shown:true },
            {},
            { limit: newest ? 100 : 10, sort: { '_id': -1 } }
        ).exec();

        (async ()=>{
            for(const m of messages)await this.readMessage(m, user.id)
        })()
        // const unreaded = this.getUnreadedAmount(chatId,curuser.id)
        
        return messages.map<Message>(m=>m.toObject()).map(msg => this.transformer.messageTransform(msg,user.id))
    }
    async checkRelationsWithUser(user1:string,user2:string){
        const is = !await this.chatModel.exists({$and:[{allUsers:{$in:[user1]}},{allUsers:{$in:[user2]}}]})
        if(is){
            await runThreads(
                async ()=>{
                    await this.sockets.sendToUser(user1,"NewUser",await this.transformer.userTransformById(user2))
                },
                async ()=>{
                    await this.sockets.sendToUser(user2,"NewUser",await this.transformer.userTransformById(user1))
                }
            )
        }
    }
    async readMessage(message1: MessageDocument, user: string) {
        const message = message1.toObject<Message>()
        if (message.user != user && !message.readedBy.some(r => r == user)) {
            await runThreads(
                async ()=>{
                    await this.sockets.sendToUser(message1.user, "UpdateMessage", { readed: true, id: message1._id+"",chat:message.chat+"" })
                },
                async ()=>{await this.messageModel.findByIdAndUpdate(message._id, { readedBy: [...message.readedBy, user] }, { new: true }).exec()},
                async ()=>{await this.notifications.clearPushForMessage(message._id+"")}
            )
        }
    }
    async getChatInfo(chatId: string, user: CUserDTO) {
        const chat = await this.chatModel.findById(chatId).exec()
        //this.checkChatAccess(chat, curUser))
            // const { title, image } = chat
            //@ts-ignore
            const users: CChatRoles = await this.roles.getChatRoles(chat)
            const unreaded = await this.getUnreadedAmount(chatId, user.id)
            const def = await this.generateChatDefaults(chatId, user.id);
            return {
                ...def,
                users: users,
                unreaded
            }
    }
    async generateChatDefaults(chatId: string, userId: string) {

        const chat = await this.chatModel.findById(chatId).populate("users").exec()
        //@ts-ignore
        const userFilter = chat.isGroup ? chat.users as User[] : chat.users.filter<User>(u => u&&u._id + "" != userId)||[{image:"",userName}]
        const users = userFilter.length==0?[{image:"users/deleted.png",userName:"Удаленный пользователь"}]:userFilter

        const title = chat.title || users.map(c => c.userName).join(", ")
        const image = chat.image || (userFilter.length==0
            ?"users/deleted.png"
            :chat.isGroup
                ? this.documents.generateImage(title, `chats/${chatId}/${title}-logo.png`)[0]
                : users[0].image)
        return {
            title,
            image: this.documents.pathToUrl(image),
        }
    }
    async list(user: CUserDTO):Promise<CChatResponse[]> {
        const allChats: (ChatDocument&{lastMessage:any})[] = await this.chatModel.find({ users: { $all: [user.id] },$or:[{shownFor:undefined},{shownFor:{ $all: [user.id] }}]},{},{sort:{lastMessage: -1}}).populate({
            path: 'lastMessage',
        }).exec()
        const chets = await Promise.all(allChats.sort(e=>e.lastMessage?e.lastMessage.time*(e.anchored.some(u=>u==user.id)?5:1):1).map(async chat => {
            const c = chat.toObject<Chat&{lastMessage:Message}>()
            const unreaded = await this.getUnreadedAmount(chat._id + "", user.id)
            const def = await this.generateChatDefaults(chat._id, user.id)
            const users = await this.roles.getChatRoles(chat)
            return await this.transformer.chatTransform({
                ...c, lastMessage: c.lastMessage&&this.transformer.messageTransform(c.lastMessage,user.id), unreaded, ...def,users
            },user.id)
        }))
        return chets
    }
    async addUser(addUserToChat:CAddUserToChatDTO,curUser: CUserDTO){
        const {chat,user} = addUserToChat
        const ch = await this.chatModel.findById(chat).exec()

        //this.checkChatAccess(ch,curUser)
        if(!ch.isGroup)throw new ForbiddenException("You cant add other users to personal chat")
        if(ch.users.some(u=>u+""==user))throw new ForbiddenException("User already exits")

        await Promise.all(ch.users.map(async u=>{
            await this.checkRelationsWithUser(user,u._id+"")
        }))
        const newChat = await this.chatModel.findByIdAndUpdate(chat,{users:[...ch.users,new Types.ObjectId(user)],allUsers:[...ch.allUsers,user]},{new:true}).exec()
        this.sockets.sendToChat(newChat,(u)=>u!==user,"UpdateChat",{id:chat._id,users:await this.roles.getChatRoles(newChat)})
        const m = await this.messageModel.findById(newChat.lastMessage).exec()
        this.sockets.sendToUser(user,"NewChat",await this.transformer.chatTransform({
            ...chat.toObject(),
            ...await this.generateChatDefaults(chat._id+"",user),
            unreaded: await this.getUnreadedAmount(chat._id+"",user),
            lastMessage:this.transformer.messageTransform(m.toObject<Message>(),user),
            users:await this.roles.getChatRoles(chat),
        },user))

        return {result:"Success"}
    }
    async removeUser(removeUserToChat: CRemoveUserToChatDTO,curUser: CUserDTO){
        const {chat,user} = removeUserToChat
        const ch = await this.chatModel.findById(chat).exec()

        if(!ch.isGroup)throw new ForbiddenException("You cant remove other users from personal chat")
        if(!ch.users.some(u=>u+""==user))throw new ForbiddenException("User not found")

        const sessions = await this.sessionModel.find({user}).exec()
        const newChat = await this.chatModel.findByIdAndUpdate(chat,{
            users:ch.users.filter(u=>u+""!==user),
            typping:ch.typping.filter(u=>!sessions.some(f=>f._id+""===u)),
            opened:ch.opened.filter(u=>!sessions.some(f=>f._id+""===u)),
            muted:ch.muted.filter(u=>u+""!==user),
            anchored:ch.anchored.filter(u=>u+""!==user),
        },{new:true}).exec()

        await this.roles.removeRole(user,chat)

        this.sockets.sendToChat(newChat,(u)=>u!==user,"UpdateChat",{
            id:chat,
            users:await this.roles.getChatRoles(newChat),
            typping:await this.transformer.getUsersFromSessions(newChat.typping),
            opened:await this.transformer.getUsersFromSessions(newChat.opened),
        })
        this.sockets.sendToUser(user,"RemoveChat",{id:chat})
        // await Promise.all(ch.users.map(async u=>{
        //     await this.checkRelationsWithUser(user,u._id+"","remove")
        // }))

        return {result:"Success"}
    }
    async leave(chatAction: CChatActionDTO, user: CUserDTO){
        const {chat} = chatAction
        if(chat.isGroup){
            const sessions = await this.sessionModel.find({user:user.id}).exec()

            const newChat = await this.chatModel.findByIdAndUpdate(chat._id,{
                users:chat.users.filter(u=>u+""!==user.id),
                typping:chat.typping.filter(u=>!sessions.some(f=>f._id+""===u)),
                opened:chat.opened.filter(u=>!sessions.some(f=>f._id+""===u)),
                muted:chat.muted.filter(u=>u+""!==user.id),
                anchored:chat.anchored.filter(u=>u+""!==user.id),
            },{new:true}).exec()

            await this.roles.removeRole(user.id,chat._id+"")

            this.sockets.sendToChat(newChat,(u)=>u!==user.id,"UpdateChat",{
                id:chat._id,
                users:await this.roles.getChatRoles(chat),
                typping:await this.transformer.getUsersFromSessions(newChat.typping),
                opened:await this.transformer.getUsersFromSessions(newChat.opened),
            })
            
            // await Promise.all(newChat.users.map(async u=>{
            //     await this.checkRelationsWithUser(user.id,u._id+"","remove")
            // }))
            return {result:"Success"}
        }else return {result:"It isn't group"}
    }
    async addUserToChatField(chatAction: CChatActionDTO, user: CUserDTO,field:keyof Chat){
        const {chat} = chatAction

        const value = [...new Set([...chat[field],user.id])]
        chat.updateOne({[field]:value}).exec()

        this.sockets.sendToUser(user.id,"UpdateChat",{id:chat._id,[field]:true})

        return {result:"Success"}
    }
    async removeUserToChatField(chatAction: CChatActionDTO, user: CUserDTO,field:keyof Chat){
        const {chat} = chatAction

        const value = chat[field].filter((u:string)=>u!=user.id)
        chat.updateOne({[field]:value}).exec()

        this.sockets.sendToUser(user.id,"UpdateChat",{id:chat._id,[field]:false})

        return {result:"Success"}
    }
    async readAll(chatAction: CChatActionDTO, user: CUserDTO){
        const {chat} = chatAction
        
        const messages = await this.messageModel.find({chat:chat._id}).exec();
        (async ()=>{
            for(const m of messages)await this.readMessage(m, user.id)
        })()

        return {result:"Success"}
    }

    /**
     * It deletes a message from a chat, and if the message was the last message in the chat, it
     * updates the chat's last message to the next most recent message
     * @param {CDeleteMessageDTO} deleteMessage - CDeleteMessageDTO
     * @param {CUserDTO} user - CUserDTO - the user who is trying to delete the message
     * @returns The result of the function is the result of the last line of the function.
     */
    async deleteMessage(deleteMessage: CDeleteMessageDTO, user: CUserDTO){
        const {message:id} = deleteMessage
        const m = await this.messageModel.findById(id).exec()
        const {chat} = m
        const c = await this.chatModel.findById(chat).exec()
        this.checkChatAccess(c,user)
        if(m&&(m.shown??false)){
            if(m.user==user.id){
                m.updateOne({shown:false}).exec()
                this.sockets.sendToChat(c,()=>true,"RemoveMessage",{id,chat})
                const lm = await this.messageModel.findOne({chat,shown:{$ne:false}},{},{sort:{_id:-1}})
                if(lm&&lm._id+""!=id){
                    this.chatModel.findByIdAndUpdate(chat,{lastMessage:lm._id}).exec()
                    const lastMessage = this.transformer.messageTransform(lm.toObject(),user.id)
                    this.sockets.sendToChat(c,()=>true,"UpdateChat",{id:chat,lastMessage})
                }
                return {result:"Success"}
            }else throw new ForbiddenException("Its not your massage")
        }else throw new ForbiddenException("Message not found")
    }

    async changeMessage(changeMessage: CChangeMessageDTO, user: CUserDTO){
        const {message:id,text:message} = changeMessage
        const m = await this.messageModel.findById(id).exec()
        const {chat} = m
        const c = await this.chatModel.findById(chat).exec()
        this.checkChatAccess(c,user)
        if(m&&(m.shown??false)){
            if(m.user==user.id){
                await m.updateOne({message}).exec()
                const {chat} = m
                this.sockets.sendToChat(c,()=>true,"UpdateMessage",{id,chat,message})
                if(c.lastMessage==id)this.sockets.sendToChat(c,()=>true,"UpdateChat",{id:chat,lastMessage:{...this.transformer.messageTransform(m.toObject(),user.id),message}})
                return {result:"Success"}
            }else throw new ForbiddenException("Its not your massage")
        }else throw new ForbiddenException("Message not found")
    }

    async deleteChat(deleteChat: CDeleteChatDTO, user: CUserDTO){
        const {chat:id} = deleteChat
        const chat = await this.chatModel.findById(id).exec()
        if(!(chat.shownFor??false)||chat.shownFor.some(u=>u==user.id)){
            await chat.updateOne({shownFor:(chat.shownFor??chat.users.map(s=>s+"")).filter(s=>s!=user.id)}).exec()
            this.sockets.sendToUser(user.id,"RemoveChat",{id:chat._id})
        }
    }

    async hideOrShowChat(chat:Chat,user:CUserDTO,type:"hide"|"show"){
        if(type=="hide"){
            this.sockets.sendToUser(user.id,"RemoveChat",{id:chat._id})
        }else if(!chat.shownFor.some(u=>u==user.id)){
            this.sockets.sendToUser(user.id,"NewChat",await this.transformer.chatTransform({
                ...chat,
                ...await this.generateChatDefaults(chat._id+"",user.id),
                unreaded: await this.getUnreadedAmount(chat._id+"",user.id),
                users:await this.roles.getChatRoles(chat),
                lastMessage:this.transformer.messageTransform(await this.messageModel.findById(chat.lastMessage).exec(),user.id),
                isGroup:false
            },user.id))
        }
    }

    async getUnreadedAmount(chatId: string, userId: string) {
        const messages: Message[] = await this.messageModel.find({ chat: chatId }, {}, { sort: { _id: -1 } }).exec()
        let amount = 0
        for (const message of messages) {
            if (message.user == userId) break
            if (!message.readedBy.some(v => v == userId)) amount++
            else break
        }
        return amount
    }
    checkChatAccess(chat: Chat, curUser: CUserDTO) {
        if (chat) {
            if (chat.users.find(u => u._id || u + "" == curUser.id)) {
                return true
            } else throw new ForbiddenException("Access denied")
        } else throw new NotFoundException("Chat not found")
    }
    readedByTransform(userId:string,lastMessage:Message){
        return {readed:userId == lastMessage.user + "" ? lastMessage.readedBy.length > 0 : undefined,readedBy:undefined,__v:undefined}
    }
    clear() {
        if (__DEV__) {
            // this.chatModel.deleteMany().exec()
            // this.messageModel.deleteMany().exec()
            // this.authService.clear()
            this.sessionService.clear()
        }
    }
}
