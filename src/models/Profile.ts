import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FILES_URL } from 'src/helpers/constant';
import { User } from './User';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
  // @Prop({type:Types.ObjectId,required:false})
  _id: Types.ObjectId;

  @Prop({type:Types.ObjectId,ref:User.name})
  user: string;

  @Prop({default:''})
  about:string

  @Prop({transform:()=>undefined})
  __v:number


  @Prop({transform:()=>undefined})
  createdAt: Date;
  @Prop({transform:()=>undefined})
  updatedAt: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);