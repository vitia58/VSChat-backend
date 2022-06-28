import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { hideTransform } from 'src/helpers/other.helper';
import { Message } from './Message';
import { User } from './User';

export type VerificationDocument = Verification & Document;

@Schema({ timestamps: true })
export class Verification {
  _id: string;

  @Prop({type:MongooseSchema.Types.ObjectId,ref:User.name})
  user: Types.ObjectId;

  @Prop()
  type:"email"|"phone"

  @Prop()
  code:string

  @Prop()
  target:string
  
  @Prop(hideTransform)
  createdAt: number;
  @Prop(hideTransform)
  updatedAt: number;
}
export const VerificationSchema = SchemaFactory.createForClass(Verification);