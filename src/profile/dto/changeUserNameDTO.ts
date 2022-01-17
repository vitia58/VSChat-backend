import { IsString } from "class-validator";

export class ChangeUserNameDTO{
    @IsString()
    userName:string
}