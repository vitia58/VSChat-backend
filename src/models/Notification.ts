import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { Message } from './Message';
import { User } from './User';

export type NotificationDocument = Notification & Document;

@Schema()
export class Notification {
  _id: string;

  @Prop({default:""})
  notificationId: string;

  @Prop()
  sessions:string[]

  @Prop()
  messageId:string
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);