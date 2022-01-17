import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { Message } from './Message';
import { User } from './User';

export type FileDocument = File & Document;

@Schema()
export class File {
  _id: string;

  @Prop({type:[MongooseSchema.Types.ObjectId],ref:User.name})
  users: Types.ObjectId[];

  @Prop({default:""})
  fileName: string;
}
export const FileSchema = SchemaFactory.createForClass(File);