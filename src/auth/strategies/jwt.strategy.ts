import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Session, SessionDocument } from 'src/models/Session';
import { User, UserDocument } from 'src/models/User';
import { UserService } from '../../user/user.service';
import { CUserDTO } from '../dto/CUserDTO';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
  constructor(
    @InjectModel(Session.name) private readonly sessionModel:Model<SessionDocument>,
    @InjectModel(User.name) private readonly userModel:Model<UserDocument>,) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: "d85jh73JF855j24",
    });
  }
  async validate(payload:any):Promise<CUserDTO>{
    // this.logger.log(payload)
    const session = await this.sessionModel.findById(payload.id).exec()
    // this.logger.log(user)
    if(session){
      const user = (await this.userModel.findById(session.user).exec()).toObject()
      // console.log(user)
      return {...user,session,id:user._id+""}
    }else throw new UnauthorizedException()
  }
}
//