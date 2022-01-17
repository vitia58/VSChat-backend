import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IdGeneratorDocument = IdGenerator & Document;

@Schema()
export class IdGenerator {
  @Prop({ required: true, default: 0 })
  id: 1;

  @Prop({ required: true, default: 0 })
  user: number;
}

export const IdGeneratorSchema = SchemaFactory.createForClass(IdGenerator);
