import { Body, Controller, Get, Param, Post, Req, UploadedFile, UseGuards } from '@nestjs/common';
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/decorators/user.decorator';
import { ObjectIdvalidatorPipe } from 'src/pipes/object-idvalidator.pipe';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    constructor(private readonly service:UserService){}
    @Get("info/:id")
    getInfo(@Param("id",new ObjectIdvalidatorPipe()) id:string){
        return this.service.getInfo(id)
    }
    @Get("related")
    @UseGuards(JwtAuthGuard)
    getRelatedUsers(@GetUser() user:CUserDTO){
        return this.service.getRelatedUsersList(user.id)
    }

    @Get("find/:name")
    @UseGuards(JwtAuthGuard)
    findByName(@Param("name") name:string,@GetUser() user:CUserDTO){
        return this.service.findByName(name,user)
    }

    @Get("find")
    @UseGuards(JwtAuthGuard)
    findAll(@GetUser() user:CUserDTO){
        return this.service.findByName("",user)
    }
}
