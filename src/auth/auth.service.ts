import { BadRequestException, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../models/User';
import { FilterQuery, Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { CLoginDTO } from './dto/CLoginDTO';
import { UserService } from '../user/user.service';
import { Session, SessionDocument } from 'src/models/Session';
import { comparePassword, hashPassword } from 'src/helpers';
import { DocumentsService } from 'src/documents/documents.service';
import { CRegisterDTO } from './dto/CRegisterDTO';
import { __DEV__ } from 'src/helpers/constant';
import { CCreateSessionDTO } from './dto/CCreateSessionDTO';
import { isEmail, isPhoneNumber } from 'class-validator';
import { VerificationService } from 'src/verification/verification.service';
import { IdGeneratorService } from 'src/id-generator/id-generator.service';
import { ConfigService } from '@nestjs/config';
import { CGoogleAuth } from './dto/CGoogleAuth';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel:Model<UserDocument>,
    @InjectModel(Session.name) private readonly sessionModel:Model<SessionDocument>,
    private readonly jwtService:JwtService,
    private readonly userService:UserService,
    private readonly documentService:DocumentsService,
    private readonly verificationService:VerificationService,
    private readonly idGen:IdGeneratorService,
    ) {}
  private readonly logger = new Logger(AuthService.name);

  async validateUser(login:string,password:string):Promise<any>{
    const user = await this.userService.findUser(this.selectLogin(login))
    if(user){
      const passwordEqual = await comparePassword(password, user.password);
      if(passwordEqual){
        const {login,id} = user
        return {login,id}
      }else throw new UnauthorizedException("")
    }
    return null
  }

  async google(google:CGoogleAuth){
    const base64Url = google.token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString("binary").split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const data:{
      name:string
      picture:string
      email:string
      email_verified:string
    } = JSON.parse(jsonPayload);
    console.log(data)
    console.log(google.token)
    if(!data.email_verified)throw new BadRequestException("Email isnt verified")

    const user = await this.userModel.findOne({email:data.email}).exec()
    const upload = (login:string,userImage:string="/logos/default.png")=>{
      if(data.picture&&userImage.endsWith("logos/default.png")){
        const path = `users/${login}/logos/${new Date().getTime()}.png`
        this.documentService.uploadImageFromUrl(path,data.picture)
        return path
      }
      return userImage
    }
    const success = async (user:UserDocument)=>{
      const session_id = await this.createSession({userID:user._id})
      const payload = {id:session_id}
      const access_token = this.jwtService.sign(payload);
      return {
        access_token,
        id:user._id
      }
    }
    if(user){
      await user.updateOne({image:upload(user.login,user.image)}).exec()
      return await success(user)
    }else{
      let newLogin = "user";
      do{
        newLogin = "user"+(await this.idGen.generateIdForUser())
      }while(await this.userModel.exists({login:newLogin}))
      const color = this.documentService.generateRandomColor()
      const userPayload:{[K in keyof User]?:User[K]} = {
        login:newLogin,
        password:"undefined",
        userName:data.name,
        image:upload(newLogin),
        email:data.email,
        color
      };
      const newUser = await new this.userModel(userPayload).save()
      return await success(newUser)
    }
  }

  async login(cLoginDTO:CLoginDTO){
    console.log(cLoginDTO)
    const user = await this.validateUser(cLoginDTO.login,cLoginDTO.password)
    if(cLoginDTO.login!="none"&&user){
      console.log(user)
      const session_id = await this.createSession({userID:user.id})
      const payload = {id:session_id}
      const access_token = this.jwtService.sign(payload);
      return {
        access_token,
        id:user.id
      }
    }else throw new UnauthorizedException("Данного пользователя с таким паролем не существует.")
  }

  async register(registerDTO:CRegisterDTO){
    const hashedPass =await hashPassword(registerDTO.password)
    const user1 = await this.userModel.exists(this.selectLogin(registerDTO.login))
    if (user1||registerDTO.login=="none")throw new UnauthorizedException("User already exist")
    let newLogin = registerDTO.login
    const isPhone = isPhoneNumber(registerDTO.login,"UA");
    const isMail =  isEmail(registerDTO.login);
    let hidden = false
    if(isMail||isPhone){
      hidden= true
      let l = "user";
      do{
        l = "user"+(await this.idGen.generateIdForUser())
      }while(await this.userModel.exists({login:l}))
      newLogin = l
    }
    const [image,color] = this.documentService.generateUserProfilePhoto(registerDTO.userName,newLogin)
    const userPayload = {
      login:newLogin,
      password:hashedPass,
      userName:registerDTO.userName,
      image,
      color,
      hidden
    };
    const user = await new this.userModel(userPayload).save()
    if(isMail)this.verificationService.sendMail(registerDTO.login,null,user.id)
    else if(isPhone)this.verificationService.sendSMS(registerDTO.login,null,user.id)
    const session_id = await this.createSession({userID:user.id})
    const payload = {id:session_id}
    const access_token = this.jwtService.sign(payload);
    const verification = 
      isMail?"email"
        :isPhone?"phone"
          :null
    return {
      access_token,
      verification,
      // session_token,
      id:user.id
    }
  }

  clear(){
    //this.logger.log(process.env.NODE_ENV)
    if(__DEV__){
      this.userModel.deleteMany().exec()
    }
  }
  async decript(jwt:string){
    return this.jwtService.decode(jwt)
  }
  async cript(payload:any){
    return this.jwtService.sign(payload)
  }
  async createSession(createSession:CCreateSessionDTO){
    const session = await new this.sessionModel({user:createSession.userID+"",lastOnline:new Date().getTime(),online:false}).save()
    // const token = this.authService.cript({id:session.id})
    return session._id
  }

  test(){
    // console.log(isPhoneNumber("vitia"));
  }

  private selectLogin(login:string){
    if(isEmail(login))return {email:login}
    else if(isPhoneNumber(login,"UA"))return {phone:login}
    else return {login}
  }
}
