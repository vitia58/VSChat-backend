import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { __DEV__ } from 'src/helpers/constant';
import { Session, SessionDocument } from 'src/models/Session';

@Injectable()
export class SessionsService {
    constructor(
        @InjectModel(Session.name) private readonly sessionModel:Model<SessionDocument>
      ){}
  clear(){
    if(__DEV__){
        this.sessionModel.deleteMany().exec()
      }
  }
}
