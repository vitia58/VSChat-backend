import { IsHexColor } from 'class-validator';
export class ChangeColorDTO {
  @IsHexColor()
  readonly color:string
}