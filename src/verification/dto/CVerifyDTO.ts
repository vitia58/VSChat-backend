import { IsEmail, IsString } from "class-validator";

export class CVerifyDTO{
    @IsString()
    code:string
}