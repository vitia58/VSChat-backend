import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../models/User';
import { FilterQuery, Model, Types } from 'mongoose';
import { Session, SessionDocument } from 'src/models/Session';
import { Chat, ChatDocument } from 'src/models/Chat';
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import { TransformersService } from 'src/transformers/transformers.service';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel:Model<UserDocument>,
  @InjectModel(Chat.name) private readonly chatModel:Model<ChatDocument>,
  @InjectModel(Session.name) private readonly sessionModel:Model<SessionDocument>,
  private readonly transormers:TransformersService
  ) {
  }
  private readonly logger = new Logger(UserService.name);
  
  async findUser(pred:FilterQuery<UserDocument>){
    return await this.userModel.findOne(pred).exec();
  }

  async getRelatedUsers(id:string){
    const chats = await this.chatModel.find({$or:[{users:{$all : [id]}},{allUsers:{$all : [id]}}]})
    // return [...new Set(...chats.map(e=>...e.users)).]
    let send = new Set<string>()
    chats.forEach(e=>{
      e.users.forEach(u=>{
        send.add(u+"")
      })
    })
    send.delete(id+"")
    return send
  }

  async getRelatedUsersList(id:string){
    const users = await this.getRelatedUsers(id)
    // console.log(users,id)
    let array:Array<User> = [];
    for (const userId of users) {
      const user = await this.userModel.findById(userId).exec()
      // array.push(await this.userSessionsTransorm(user,id))
      //@ts-ignore
      if(user)array.push(await this.transormers.userTransormByDocument(user))
    }
    return array;
  }

  async getInfo(id:string){
    const user = await this.userModel.findById(id).exec()
    // this.sessionModel.find({user:id})
    return user.toObject()
  }

  async findByName(name:string,user:CUserDTO):Promise<CUserResponse[]>{
    const regex = new RegExp(name, 'i');
    const users = await this.userModel.find({userName:{$regex:regex},"_id":{ $ne: user._id },hiden:{$ne:true}},{},{limit:10})
    console.log(users);
    
    return await Promise.all(users.map(async e=>await this.transormers.userTransormByDocument(e)))
  }

  async checkIsChatOpened(userId:string,chatId:string){
    const sessions = await this.sessionModel.find({user:userId})
    const chat = await this.chatModel.findById(chatId)
    // console.log((chat.opened||[]),userId)
    return (chat.opened||[]).find(o=>sessions.find(s=>s._id==o))
  }

  async getRelatedChats(userIds:string[]){
    const uids = userIds.map(u=>new Types.ObjectId(u))
    const chats = await this.chatModel.find({users:{$in:uids}}).exec()
    return chats.map(c=>c._id+"")
  }
}
