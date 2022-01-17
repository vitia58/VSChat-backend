import { IsEmail, IsString } from "class-validator";

export class CSendEmail{
    @IsEmail()
    email:string
}