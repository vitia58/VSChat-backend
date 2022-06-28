import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { hideTransform } from 'src/helpers/other.helper';
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

  @Prop(hideTransform)
  createdAt: number;
  @Prop(hideTransform)
  updatedAt: number;
}

export const SessionSchema = SchemaFactory.createForClass(Session);