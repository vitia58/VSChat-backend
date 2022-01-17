import { IsString,IsMongoId } from 'class-validator';
import { isValidObjectId, Types } from 'mongoose';
export class CCreateChatWithUserDTO {
  @IsMongoId()
  user:Types.ObjectId
}