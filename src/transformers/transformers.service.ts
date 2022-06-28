import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Mongoose, SchemaTypes, Types } from 'mongoose';
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import { CChatRoles } from 'src/chat-roles/dto/CChatRoles';
import { CRole } from 'src/chat-roles/dto/CRoles';
import { CChatResponse } from 'src/chat/dto/CChatResponse';
import { Chat, ChatDocument } from 'src/models/Chat';
import { ChatRoles, ChatRolesDocument } from 'src/models/ChatRoles';
import { Message } from 'src/models/Message';
import { Profile, ProfileDocument } from 'src/models/Profile';
import { Session, SessionDocument } from 'src/models/Session';
import { User, UserDocument } from 'src/models/User';
import { SessionsService } from 'src/sessions/sessions.service';

@Injectable()
export class TransformersService {
	constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
		@InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
		@InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
		@InjectModel(Profile.name) private readonly profileModel: Model<ProfileDocument>,
        @InjectModel(ChatRoles.name) private readonly rolesModel: Model<ChatRolesDocument>,) {
	}
	private async userTransorm(userId: string):Promise<{
		online: number | true;
		__v: any;
	}> {
		const sessions = await this.sessionModel.find({ user: userId }).exec()
		const profile = await this.profileModel.findOne({user:userId})
		const privacy = {}
		if(profile){
			const {privacyEmail,privacyPhone} = profile.toObject<Profile>()
			if(!privacyEmail)Object.assign(privacy,{email:undefined})
			if(!privacyPhone)Object.assign(privacy,{phone:undefined})
		}
		const count = sessions.filter(e => e.online).length
		const offline = sessions.filter(e => !e.online)
		const online = count > 0 ? true: Math.max(...offline.map(e => e.lastOnline))
		// console.log(count,offline,online)
		return {
			online, __v: undefined,...privacy
		}
	}
	async userTransormByDocument(u: UserDocument): Promise<LeanDocument<UserDocument> & { online: true | number }> {
		return {
			...u.toObject<User>(), ...await this.userTransorm(u.id)
		}
	}
	async userTransformByAuth(u: CUserDTO): Promise<CUserDTO & { online: true | number }> {
		return {
			...u, ...await this.userTransorm(u.id)
		}
	}
	async userTransformById(uId: string): Promise<CUserResponse> {
		const user = await this.userModel.findById(uId).exec()
		if (!user) return null
		//@ts-ignore
		return {
			...user.toObject(), ...this.userTransorm(uId)
		}
	}
	async chatTransform(chat: any,user:string): Promise<CChatResponse> {
		return {
			...chat,
			__v:undefined,
			_id:undefined,
			//@ts-ignore
			id:chat.id??chat._id+"",
			typping: await this.getUsersFromSessions(chat.typping),
			opened: await this.getUsersFromSessions(chat.opened),
			muted:chat.muted.some((m:string)=>m==user),
			anchored:chat.anchored.some((m:string)=>m==user)
		}
	}
	
	messageTransform(msg: Message,userid:string): CMessageResponse {
		return {
			chat:msg.chat,
			id: msg._id,
			time: msg.time,
			message: msg.message,
			file:msg.file,
			fileType:msg.fileType,
			user: msg.user,
			...this.readedByTransform(userid,msg)
		}
	}
	
    readedByTransform(userId:string,lastMessage:Message){
        return {readed:userId == lastMessage.user + "" ? lastMessage.readedBy.length > 0 : undefined,readedBy:undefined,__v:undefined}
    }

	async getUsersFromSessions(s: string[]) {
		if (s.length == 0) return []
		const sessions = await this.sessionModel.find({ _id: { $in: s } }).exec()
		const users = sessions.map(s => s.user)
		return [...new Set(users)]
	}
}
