import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/decorators/user.decorator';
import { ObjectIdvalidatorPipe } from 'src/pipes/object-idvalidator.pipe';
import { CSendEmail } from './dto/CSendEmailDTO';
import { CSendSMSDTO } from './dto/CSendSMSDTO';
import { CVerifyDTO } from './dto/CVerifyDTO';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
    constructor(private service:VerificationService){}
    @Post("sendEmail")
    @UseGuards(JwtAuthGuard)
    async sendEmail(@Body(new ObjectIdvalidatorPipe()) email:CSendEmail,@GetUser() user:CUserDTO){
        return await this.service.sendMail(email.email,user.email,user.id)
    }
    @Post("verifyEmail")
    @UseGuards(JwtAuthGuard)
    async verifyEmail(@Body(new ObjectIdvalidatorPipe()) verify:CVerifyDTO,@GetUser() user:CUserDTO){
        return await this.service.verifyEmail(verify,user)
    }
    @Post("sendSMS")
    @UseGuards(JwtAuthGuard)
    async sendSMS(@Body(new ObjectIdvalidatorPipe()) email:CSendSMSDTO,@GetUser() user:CUserDTO){
        return await this.service.sendSMS(email.phone.startsWith("38")?email.phone:`38${email.phone}`,user.phone.startsWith("38")?user.phone:`38${user.phone}`,user.id)
    }
    @Post("verifySMS")
    @UseGuards(JwtAuthGuard)
    async verifySMS(@Body(new ObjectIdvalidatorPipe()) verify:CVerifyDTO,@GetUser() user:CUserDTO){
        return await this.service.verifySMS(verify,user)
    }
}
