import { IsEnum, IsMongoId, IsObject, IsString } from 'class-validator';
import { ChatDocument } from 'src/models/Chat';
export class CUploadFileDTO {
  @IsMongoId()
  readonly chat:string
  @IsEnum(["voice","image","file"])
  readonly fileType:string
}