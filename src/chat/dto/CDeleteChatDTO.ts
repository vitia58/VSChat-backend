import { IsMongoId, IsObject } from 'class-validator';
import { ChatDocument } from 'src/models/Chat';
export class CDeleteChatDTO {
  @IsObject()
  readonly chat:ChatDocument
}