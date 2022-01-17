import { IsMongoId, isString, IsString } from 'class-validator';
export class CSetOnesignalDTO {
  @IsString()
  readonly oneSignal:string
}