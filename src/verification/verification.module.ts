import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MongooseModule } from '@nestjs/mongoose';
import { Verification, VerificationSchema } from 'src/models/Verification';
import { User, UserSchema } from 'src/models/User';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: Verification.name, schema: VerificationSchema },
      // { name: Chat.name, schema: ChatSchema },
      { name: User.name, schema: UserSchema }
    ]),
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports:[VerificationService]
})
export class VerificationModule {}
