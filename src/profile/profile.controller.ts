import { Body, Controller, Get, Param, Post, UploadedFile, UseGuards } from '@nestjs/common';
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UploadFile } from 'src/decorators/CustomFileInterceptor';
import { GetUser } from 'src/decorators/user.decorator';
import { ObjectIdvalidatorPipe } from 'src/pipes/object-idvalidator.pipe';
import { ChangeAboutDTO } from './dto/changeAboutDTO';
import { ChangeColorDTO } from './dto/ChangeColorDTO';
import { ChangePrivacyDTO } from './dto/ChangePrivacyDTO';
import { ChangeUserNameDTO } from './dto/changeUserNameDTO';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
    constructor(private readonly service:ProfileService){}
    @Get("my")
    @UseGuards(JwtAuthGuard)
    getMyProfile(@GetUser() user:CUserDTO){
        return this.service.getMyProfile(user)
    }
    @Get("get/:id")
    @UseGuards(JwtAuthGuard)
    async getProfile(@Param("id",new ObjectIdvalidatorPipe()) id:string,@GetUser() user:CUserDTO){
        const res = await this.service.getOtherProfile(id,user);
        console.log(res)
        return res
    }

    @Get("logout")
    @UseGuards(JwtAuthGuard)
    logout(@GetUser() user:CUserDTO){
        return this.service.logout(user)
    }

    @Post("about")
    @UseGuards(JwtAuthGuard)
    changeAbout(@Body(new ObjectIdvalidatorPipe()) changeAbout:ChangeAboutDTO,@GetUser() user:CUserDTO){
        return this.service.changeAbout(user,changeAbout)
    }
    
    @Post("changeColor")
    @UseGuards(JwtAuthGuard)
    changeColor(@Body(new ObjectIdvalidatorPipe()) color:ChangeColorDTO,@GetUser() user:CUserDTO){
        return this.service.changeColor(color,user)
    }
    
    @Post("userPhoto")
    @UseGuards(JwtAuthGuard)
    @UploadFile({typeFile:'image',fieldName:'image'})
    uploadUserPhoto(@UploadedFile() file: Express.Multer.File,@GetUser() user:CUserDTO){
        return this.service.uploadUserImage(file,user)
    }
    
    @Post("userName")
    @UseGuards(JwtAuthGuard)
    changeUserName(@Body(new ObjectIdvalidatorPipe()) changeUserName:ChangeUserNameDTO,@GetUser() user:CUserDTO){
        return this.service.changeUserName(user,changeUserName)
    }
    
    @Post("privacy")
    @UseGuards(JwtAuthGuard)
    changePrivacy(@Body(new ObjectIdvalidatorPipe()) changePrivacy:ChangePrivacyDTO,@GetUser() user:CUserDTO){
        return this.service.changePrivacy(changePrivacy,user)
    }
}
