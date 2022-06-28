import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FILES_URL } from 'src/helpers/constant';
import { hideTransform } from 'src/helpers/other.helper';
import { Chat } from './Chat';
import { User } from './User';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true, })
export class Message {
  _id: string;

  @Prop({type:Types.ObjectId,ref:User.name})
  user: string;

  // @Prop({type:Types.ObjectId,ref:Chat.name})
  @Prop()  
  chat: string;

  @Prop()
  message: string;

  @Prop()
  time: number;

  @Prop({default:[]})
  readedBy: string[];

  @Prop({default:null})
  reply:string|null

  @Prop({default:[],transform:(v:string[])=>(v??[]).map(f=>`${FILES_URL}/${f}`)})
  file:string[]

  @Prop({enum:["voice","image","file",null],default:null})
  fileType:"voice"|"image"|"file"|null

  @Prop({transform:()=>undefined,default:true})
  shown: boolean;
  
  @Prop(hideTransform)
  __v:number
  @Prop(hideTransform)
  createdAt: number;
  @Prop(hideTransform)
  updatedAt: number;
}

export const MessageSchema = SchemaFactory.createForClass(Message);