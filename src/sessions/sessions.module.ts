import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from 'src/models/Session';
import { User, UserSchema } from 'src/models/User';
import { SessionsService } from './sessions.service';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name:User.name,schema:UserSchema},
      {name:Session.name,schema:SessionSchema},
    ]),
  ],
  providers: [SessionsService],
  exports:[SessionsService]
})
export class SessionsModule {}
