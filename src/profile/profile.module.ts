import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsModule } from 'src/documents/documents.module';
import { Profile, ProfileSchema } from 'src/models/Profile';
import { Session, SessionSchema } from 'src/models/Session';
import { User, UserSchema } from 'src/models/User';
import { Verification, VerificationSchema } from 'src/models/Verification';
import { SocketModule } from 'src/socket/socket.module';
import { TransformersModule } from 'src/transformers/transformers.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name:User.name,schema:UserSchema},
      {name:Session.name,schema:SessionSchema},
      {name:Profile.name,schema:ProfileSchema},
      {name:Verification.name,schema:VerificationSchema},
    ]),
    DocumentsModule,
    SocketModule,
    TransformersModule
  ],
  controllers: [ProfileController],
  providers: [ProfileService]
})
export class ProfileModule {}
