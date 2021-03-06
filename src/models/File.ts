import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { Message } from './Message';
import { User } from './User';

export type FileDocument = File & Document;

@Schema()
export class File {
  _id: string;

  @Prop({default:""})
  path: string;

  @Prop({enum:["voice","image","file",null],default:null})
  fileType:"voice"|"image"|"file"|null
}
export const FileSchema = SchemaFactory.createForClass(File);