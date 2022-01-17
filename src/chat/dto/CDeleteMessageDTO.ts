import { IsMongoId } from 'class-validator';
export class CDeleteMessageDTO {
  @IsMongoId()
  readonly message:string
}