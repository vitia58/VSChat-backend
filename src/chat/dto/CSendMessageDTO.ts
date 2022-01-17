import { IsMongoId, IsObject, IsOptional, IsString } from 'class-validator';
import { ChatDocument } from 'src/models/Chat';
export class CSendMessageDTO {
  @IsObject()
  readonly chat:ChatDocument
  @IsString()
  readonly message:string
  @IsMongoId()
  @IsOptional()
  readonly reply:string
}