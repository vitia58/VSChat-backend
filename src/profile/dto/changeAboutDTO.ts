import { IsString } from "class-validator";

export class ChangeAboutDTO{
    @IsString()
    about:string
}