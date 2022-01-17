import { IsMongoId, IsObject } from 'class-validator';
import { ChatDocument } from 'src/models/Chat';
export class CChatActionDTO {
  @IsObject()
  readonly chat:ChatDocument
}