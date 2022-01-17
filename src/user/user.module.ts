import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../models/User';
import { UserController } from './user.controller';
import { Session, SessionSchema } from 'src/models/Session';
import { Chat, ChatSchema } from 'src/models/Chat';
import { DocumentsModule } from 'src/documents/documents.module';
import { TransformersModule } from 'src/transformers/transformers.module';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Session.name, schema: SessionSchema },
    { name: Chat.name, schema: ChatSchema },
    { name: User.name, schema: UserSchema }]),
    TransformersModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule { }
