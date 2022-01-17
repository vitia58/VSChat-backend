import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './User';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  _id: string;

  @Prop({type:Types.ObjectId,ref:User.name})
  user: string;

  @Prop()
  oneSignal: string;

  @Prop({default:false})
  online:boolean

  @Prop({default:new Date().getTime()})
  lastOnline:number

  @Prop({default:[],transform:()=>undefined})
  deliverySocketBuffer:string[]

  @Prop({transform:()=>undefined})
  createdAt: Date;
  @Prop({transform:()=>undefined})
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);