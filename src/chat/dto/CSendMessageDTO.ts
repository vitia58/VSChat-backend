import { IsInt, isInt, IsMongoId, IsObject, IsOptional, IsString } from 'class-validator';
import { ChatDocument } from 'src/models/Chat';
export class CSendMessageDTO {
  @IsObject()
  readonly chat:ChatDocument
  @IsString()
  @IsOptional()
  readonly message:string
  @IsMongoId({each:true})
  @IsOptional()
  readonly files:string[]
  @IsMongoId()
  @IsOptional()
  readonly reply:string
  @IsInt()
  readonly sendId:number
}