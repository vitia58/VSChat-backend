import { IsString } from 'class-validator';
export class CCreateSessionDTO {
  @IsString()
  readonly userID:string
  
}