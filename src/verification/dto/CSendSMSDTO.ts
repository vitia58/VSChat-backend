import { IsEmail, IsPhoneNumber, IsString } from "class-validator";

export class CSendSMSDTO{
    @IsPhoneNumber("UA")
    phone:string
}