import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from 'src/models/Chat';
import { ChatRoles, ChatRolesDocument } from 'src/models/ChatRoles';
import { CChatRoles } from './dto/CChatRoles';
import { CRole } from './dto/CRoles';

@Injectable()
export class ChatRolesService {
    constructor(
        @InjectModel(ChatRoles.name) private readonly rolesModel: Model<ChatRolesDocument>,
        @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
    ) { }
    async getRole(userId:string,chatId:string):Promise<CRole>{
        const role = await this.rolesModel.findOne({user:userId,chat:chatId}).exec()
        return role.toObject()
    }
    async getChatRoles(chat:Chat):Promise<CChatRoles>{
        const roles = await this.rolesModel.find({chat:chat._id+""}).exec()
        
        const usersWithRoles = chat.users.map(u=>{
            const roleDocument = roles.find(r=>u.equals(r.user))
            const defaultRole:CRole = {
                roleName:"",
                roleType:'common',
                user:u+""
            }
            const {roleName,roleType,user} = roleDocument?roleDocument.toObject():defaultRole
            return {roleName,roleType,user}
        })
        return usersWithRoles
    }
    async getChatByIdRoles(chatId:string){
        const chat = await this.chatModel.findById(chatId).exec()
        return this.getChatRoles(chat)
    }
    async setRole(user:string,chat:string,roleName:string,roleType:"common"|"admin"){
        if(await this.rolesModel.exists({user,chat})){
            await this.rolesModel.updateOne({chat,user},{roleName,roleType}).exec()
        }else{
            await new this.rolesModel({ user,chat,roleName,roleType }).save()
        }
    }
    async removeRole(user:string,chat:string){
        await this.rolesModel.deleteOne({user,chat}).exec()
    }
}
