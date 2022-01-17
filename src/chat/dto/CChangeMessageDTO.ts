import { IsMongoId, IsString, Length } from 'class-validator';
export class CChangeMessageDTO {
  @IsMongoId()
  readonly message:string
  @IsString({})
  @Length(1)
  readonly text:string
}