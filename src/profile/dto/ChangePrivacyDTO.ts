import { IsBoolean, IsEnum, IsString } from "class-validator";

export class ChangePrivacyDTO{
    @IsBoolean()
    value:boolean
    @IsEnum(["phone","email"])
    type:"phone"|"email"
}