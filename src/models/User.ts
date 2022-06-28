import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FILES_URL } from 'src/helpers/constant';
import { hideTransform } from 'src/helpers/other.helper';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({required:true})
  login: string;

  @Prop({default:""})
  userName:string;

  @Prop({required:true,transform:()=>undefined})
  password: string;

  @Prop({default:"none"})
  email: string;

  @Prop({default:"none",transform:(v:string)=>`+${v}`})
  phone: string;

  @Prop({transform:(v:string)=>`${FILES_URL}/${v}`})
  image: string;

  @Prop({transform:(v:string)=>`#${v}`})
  color:string

  @Prop({default:false})
  hiden:boolean

  @Prop(hideTransform)
  __v:number
  @Prop(hideTransform)
  createdAt: number;
  @Prop(hideTransform)
  updatedAt: number;
}

export const UserSchema = SchemaFactory.createForClass(User);