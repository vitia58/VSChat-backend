import { forwardRef, Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/models/User';
import { Session, SessionSchema } from 'src/models/Session';
import { AuthModule } from 'src/auth/auth.module';
import { Message, MessageSchema } from 'src/models/Message';
import { Chat, ChatSchema } from 'src/models/Chat';
import { UserModule } from 'src/user/user.module';
import { SocketModule } from 'src/socket/socket.module';
import { DocumentsModule } from 'src/documents/documents.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { TransformersModule } from 'src/transformers/transformers.module';
import { ChatRolesModule } from 'src/chat-roles/chat-roles.module';

@Module({
  imports: [MongooseModule.forFeature([
    {name:Session.name,schema:SessionSchema},
    // {name:User.name,schema:UserSchema},
    { name: Message.name, schema: MessageSchema },
    { name: Chat.name, schema: ChatSchema }
  ]),
    // AuthModule,
    UserModule,
    SocketModule,
    SessionsModule,
    DocumentsModule,
    forwardRef(() => NotificationsModule),
    TransformersModule,
    ChatRolesModule
  ],
  providers: [ChatService],
  controllers: [ChatController],
  exports:[ChatService]
})
export class ChatModule { }
