import { IsMongoId, IsObject } from 'class-validator';
import { ChatDocument } from 'src/models/Chat';
export class CAddUserToChatDTO {
  // @IsMongoId()
  @IsObject()
  readonly chat:ChatDocument
  @IsMongoId()
  readonly user:string
}