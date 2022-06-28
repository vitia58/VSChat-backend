import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'src/models/Chat';
import { ChatRoles, ChatRolesSchema } from 'src/models/ChatRoles';
import { Profile, ProfileSchema } from 'src/models/Profile';
import { Session, SessionSchema } from 'src/models/Session';
import { User, UserSchema } from 'src/models/User';
import { SessionsModule } from 'src/sessions/sessions.module';
import { TransformersService } from './transformers.service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Session.name, schema: SessionSchema },
    { name: Chat.name, schema: ChatSchema },
    { name: User.name, schema: UserSchema },
    { name: ChatRoles.name, schema: ChatRolesSchema },
    { name: Profile.name, schema: ProfileSchema },
  ])],
  providers: [TransformersService],
  exports:[TransformersService]
})
export class TransformersModule {}
