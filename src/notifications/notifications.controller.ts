import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { use } from 'passport';
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/decorators/user.decorator';
import { ObjectIdvalidatorPipe } from 'src/pipes/object-idvalidator.pipe';
import { CSetOnesignalDTO } from './dto/CSetOnesignalDTO';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private notifcation:NotificationsService){}
    @UseGuards(JwtAuthGuard)
    @Post("setOnesignal")
    setOnesignal(@Body(new ObjectIdvalidatorPipe()) message:CSetOnesignalDTO,@GetUser() user:CUserDTO){
        return this.notifcation.setOneSignal(message,user)
    }
    @Post("test")
    test(){
        this.notifcation.sendPush(["5a4ea8e9-a213-4ff4-8acc-8071dfa82ed7"],{message:"123",title:"345",image:"https://vschat-online.000webhostapp.com/users/vitia/1636407477761.png"},{i:1234})
    }
}
