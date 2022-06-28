import { IsMongoId, IsOptional, IsString } from 'class-validator';
export class CNotificationBodyDTO {
  @IsMongoId()
  readonly title:string
  @IsString()
  readonly message:string
  @IsString()
  readonly image:string
  @IsString()
  @IsOptional()
  readonly bigImage?:string
}