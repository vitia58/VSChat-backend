import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FILES_URL } from 'src/helpers/constant';
import { defaultTransform, hideTransform } from 'src/helpers/other.helper';
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

  @Prop(defaultTransform(true))
  privacyEmail:boolean

  @Prop(defaultTransform(true))
  privacyPhone:boolean

  @Prop(hideTransform)
  __v:number
  @Prop(hideTransform)
  createdAt: number;
  @Prop(hideTransform)
  updatedAt: number;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);