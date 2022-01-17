import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FILES_URL } from 'src/helpers/constant';

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

  @Prop({default:"none"})
  phone: string;

  @Prop({transform:(v:string)=>v.replace("public_html/", `${FILES_URL}/`)})
  image: string;

  @Prop({transform:(v:string)=>`#${v}`})
  color:string

  @Prop({default:false})
  hiden:boolean

  @Prop({transform:()=>undefined})
  __v:number

  @Prop({transform:()=>undefined})
  createdAt: Date;
  @Prop({transform:()=>undefined})
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);