import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import fetch from 'node-fetch';
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import { __DEV__ } from 'src/helpers/constant';
import { User, UserDocument } from 'src/models/User';
import { Verification, VerificationDocument } from 'src/models/Verification';
import { CSendEmail } from './dto/CSendEmailDTO';
import { CVerifyDTO } from './dto/CVerifyDTO';

@Injectable()
export class VerificationService {
    constructor(
        private readonly mailerService: MailerService,
        @InjectModel(Verification.name) private readonly verificationModel:Model<VerificationDocument>,
        @InjectModel(User.name) private readonly userModel:Model<UserDocument>
    ) {}
    private readonly logger = new Logger(VerificationService.name);
    async send(target:string,userTarget:string|null,targetName:"email"|"phone",userId:string,send:(code:string)=>Promise<void>,alreadyExeptionText:string){
        if(userTarget&&userTarget==target)return {result:"Confirmed"}
        else if(!await this.checkExist(targetName,target)){

            const code = this.generateCode()
            try{
                await send(code)
            }catch(e){
                this.logger.error(e)
                throw new BadRequestException("Sending error")
            }
            await this.verificationModel.deleteOne({user:userId,type:targetName}).exec()
            await new this.verificationModel({target,user:userId,code,type:targetName}).save()
            return {result:"Sent",verifyCode:code}
        }else throw new ConflictException(alreadyExeptionText)
    }
    
    async verify(verify:CVerifyDTO,user:CUserDTO,fieldName:"email"|"phone"){
        const res = await this.verificationModel.findOne({user:user._id,type:fieldName}).exec()
        if(!res)return {result:"Validation not found"}
        const {target,code} = res
        if(code==verify.code){
            this.verificationModel.deleteOne({user:user._id,type:fieldName}).exec()
            await (await this.userModel.findByIdAndUpdate(user._id,{[fieldName]:target,hiden:false},{new:true})).save()
            return {result:"Confirmed"}
        }else return {result:"Code isn't valid"}
    }

    async sendMail(email:string,userEmail:string|null,userId:string){
        return this.send(email,userEmail,"email",userId,async (code)=>{
            await this.mailerService.sendMail({
                to: email,
                from: 'monopoly2vs@gmail.com',
                subject: 'Подтверждение почты ',
                html: this.generateEmailText(code),
            })
        },"Email is already used")
    }
    async sendSMS(phone:string,userPhone:string|null,userId:string){
        return this.send(phone,userPhone,"phone",userId,async (code:string)=>{
            const res = await fetch(`https://smsc.ru/sys/send.php?login=vitia58&psw=vitiandslava&phones=${phone}&mes=${this.generateSMSText(code)}&sender=VS chat`)
            this.logger.log(`Отпрвка сообщения успешна: ${JSON.stringify(res)}`)
        },"This phone number is already used")
    }

    async verifyEmail(verify:CVerifyDTO,user:CUserDTO){
        return this.verify(verify,user,"email")
    }
    async verifySMS(verify:CVerifyDTO,user:CUserDTO){
        return this.verify(verify,user,"phone")
    }
    
    private generateEmailText(code:string){
        return `Код подтверждения вашего email: <b>${code}<b>`
    }
    private generateSMSText(code:string){
        return `Код подтверждения: ${code}`
    }
    private generateCode():string{
        return __DEV__?"12345":("0000"+Math.floor(Math.random()*100_000)).slice(-5)
    }
    private async checkExist(type:"email"|"phone",target:string){
        return await this.userModel.exists({[type]:target});
    }
}
