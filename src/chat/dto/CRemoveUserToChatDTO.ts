import { IsMongoId } from 'class-validator';
export class CRemoveUserToChatDTO {
  @IsMongoId()
  readonly chat:string
  @IsMongoId()
  readonly user:string
}