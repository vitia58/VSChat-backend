import { BadRequestException, Injectable, Logger} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import { DocumentsService } from 'src/documents/documents.service';
import { FTP_ENABLED } from 'src/helpers/constant';
import { Profile, ProfileDocument } from 'src/models/Profile';
import { Session, SessionDocument } from 'src/models/Session';
import { User, UserDocument } from 'src/models/User';
import { Verification, VerificationDocument } from 'src/models/Verification';
import { SocketRouter } from 'src/socket/socket.router';
import { TransformersService } from 'src/transformers/transformers.service';
import { ChangeAboutDTO } from './dto/changeAboutDTO';
import { ChangeColorDTO } from './dto/ChangeColorDTO';
import { ChangeUserNameDTO } from './dto/changeUserNameDTO';
import * as mine from 'mime-types'
import { ChangePrivacyDTO } from './dto/ChangePrivacyDTO';
import { runThreads } from 'src/helpers/other.helper';

@Injectable()
export class ProfileService {
    constructor(
        @InjectModel(User.name) private readonly userModel:Model<UserDocument>,
        @InjectModel(Session.name) private readonly sessionModel:Model<SessionDocument>,
        @InjectModel(Profile.name) private readonly profileModel:Model<ProfileDocument>,
        @InjectModel(Verification.name) private readonly verificationModel:Model<VerificationDocument>,

        private readonly documents:DocumentsService,
        private readonly socket:SocketRouter,
        private readonly transormers:TransformersService
    ){}
    private readonly logger = new Logger(ProfileService.name);
    async getMyProfile(user:CUserDTO){
        // console.log(user)
        const {color,userName,image,online} = await this.transormers.userTransformByAuth(user)
        const {about,privacyEmail,privacyPhone} = (await this.getOrGenerate(user.id)).toObject<Profile>()
        const verifications = await this.verificationModel.find({user:user.id}).exec()
        const {target:newEmail} = verifications.find(e=>e.target=="email")??{target:null};
        const {target:newPhone} = verifications.find(e=>e.target=="phone")??{target:null};
        const email =  newEmail || user.email
        const emailVerified = user.email!="none"
        const phone =  newPhone || user.phone
        const phoneVerified = user.phone!="none"
        return {
            color,
            userName,
            about,
            image,
            online:online===true,
            email,
            emailVerified,
            phone,
            phoneVerified,
            privacyEmail,
            privacyPhone
        }
    }
    async getOtherProfile(id:string,user:CUserDTO){
        console.log(id,user)
        const {color,userName,image,email,phone,online} = await this.transormers.userTransformById(id)
        const {about,privacyEmail,privacyPhone} = (await this.getOrGenerate(id)).toObject()
        return {
            color,
            userName,
            about,
            image,
            email:privacyEmail&&email!="none"?email:undefined,
            phone:privacyPhone&&phone!="none"?phone:undefined,
            online
        }
    }

    async logout(user:CUserDTO){
        await this.sessionModel.findByIdAndRemove(user.session._id)
        this.socket.logout(user.session._id+"")
    }

    async changeAbout(user:CUserDTO,changeAboutDTO:ChangeAboutDTO){
        try {
           (await this.getOrGenerate(user.id)).updateOne(changeAboutDTO).exec()
            // await this.profileModel.findOneAndUpdate({user:user.id},changeAboutDTO,{new:true}).exec()
        } catch (error) {
            this.logger.error(error)
            throw new BadRequestException(error)
        }
        return {result:"Success"}
    }

    async changeColor(c:ChangeColorDTO,user:CUserDTO){
        const color = c.color.substring(1)
        if(user.color!=color){
            console.log(c,user)
            if(FTP_ENABLED&&user.image.endsWith("logos/default.png"))this.documents.generateUserProfilePhoto(user.userName,user.login,color)
            // console.log(image)
            this.userModel.findByIdAndUpdate(user.id,{color}).exec()
            this.socket.sendToAllRelatedUsers(user.id,"UpdateUser",{id:user.id,color})
        }
        return {result:"Color changed"}
    }

    async uploadUserImage(file: Express.Multer.File,user:CUserDTO){
        console.log(file,user)
        console.log("uploadUserImage")
        if(FTP_ENABLED){
            console.log("ftp enabled")
            const path =`users/${user.login}/logos/${new Date().getTime()}.${mine.extension(file.mimetype)}`
            await runThreads(
                async ()=>{
                    await this.documents.uploadFile(file,path)
                },
                async ()=>{
                    await this.userModel.findByIdAndUpdate(user.id,{image:path}).exec()
                },
                async ()=>{
                    await this.socket.sendToAllRelatedUsers(user.id,"UpdateUser",{id:user.id,image:path})
                }
            )
        }
        return {result:"Success"}
    }

    async changeUserName(user:CUserDTO,changeUserName:ChangeUserNameDTO){
    //   this.logger.log(user,changeUserName)
    const {userName} = changeUserName
      try {
          await this.userModel.findByIdAndUpdate(user.id,{userName},{new:true}).exec()
      } catch (error) {
          this.logger.error(error)
          throw new BadRequestException(error)
      }
      await this.socket.sendToAllRelatedUsers(user.id,"UpdateUser",{id:user.id,userName})
      return {result:"Success"}
    }
    async changePrivacy(changePrivacy: ChangePrivacyDTO, user: CUserDTO){
        const {value,type} = changePrivacy
        try {
            (await this.getOrGenerate(user.id)).updateOne({[type=="email"?"privacyEmail":"privacyPhone"]:value}).exec()
         } catch (error) {
             this.logger.error(error)
             throw new BadRequestException(error)
         }
         return {result:"Success"}
    }

    private async getOrGenerate(userId:string){
        const profile = await this.profileModel.findOne({user:userId}).exec()
        if(!profile) return new this.profileModel({user:userId}).save()
        return profile
    }
}
