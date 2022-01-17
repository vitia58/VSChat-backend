import { IsString,IsMongoId } from 'class-validator';
import { isValidObjectId } from 'mongoose';
export class CCreateChatDTO {
  @IsMongoId({each: true})
  users:string[]
}