import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { hideTransform } from 'src/helpers/other.helper';
import { Message } from './Message';
import { User } from './User';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
  _id: string;

  @Prop({type:[MongooseSchema.Types.ObjectId],ref:User.name})
  users: Types.ObjectId[];

  @Prop({default:[],transform:()=>undefined})
  allUsers: string[];

  @Prop({default:""})
  image: string;

  @Prop({default:""})
  title: string;

  @Prop({type:Types.ObjectId,ref:Message.name})
  lastMessage: string

  @Prop({default:true})
  isGroup:boolean

  @Prop({default:[]})//SESSION IDS
  opened:string[]

  @Prop({default:[]})//SESSION IDS
  typping:string[]

  @Prop({default:[]})//USER IDS
  muted:string[]

  @Prop({default:[]})//USER IDS
  anchored:string[]

  @Prop({default:[],transform:()=>undefined})//USER IDS
  shownFor:string[]

  @Prop(hideTransform)
  __v:number
  @Prop(hideTransform)
  createdAt: number;
  @Prop(hideTransform)
  updatedAt: number;
}
export const ChatSchema = SchemaFactory.createForClass(Chat);