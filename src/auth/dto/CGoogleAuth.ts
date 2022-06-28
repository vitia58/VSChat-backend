import { IsNotEmpty, IsString } from 'class-validator';
export class CGoogleAuth {
  @IsString()
  @IsNotEmpty()
  readonly token:string
}