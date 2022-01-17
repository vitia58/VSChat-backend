import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FILES_URL } from 'src/helpers/constant';
import { Chat } from './Chat';
import { User } from './User';

export type ChatRolesDocument = ChatRoles & Document;

@Schema({})
export class ChatRoles {
  _id: Types.ObjectId;

  @Prop({type:Types.ObjectId,ref:User.name})
  user: string;

  @Prop({type:Types.ObjectId,ref:Chat.name})
  chat: string;

  @Prop({default:''})
  roleName:string

  @Prop({enum: ['common', 'admin'], default: 'common',})
  roleType:'common'|'admin'

  @Prop({transform:()=>undefined})
  __v:number
}

export const ChatRolesSchema = SchemaFactory.createForClass(ChatRoles);