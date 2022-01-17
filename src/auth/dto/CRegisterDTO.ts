import { IsString } from 'class-validator';
export class CRegisterDTO {
  @IsString()
  readonly userName:string
  @IsString()
  readonly login:string
  @IsString()
  readonly password:string
}