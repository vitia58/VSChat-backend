import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { ChatModule } from 'src/chat/chat.module';
import { Chat, ChatSchema } from 'src/models/Chat';
import { Message, MessageSchema } from 'src/models/Message';
import { Session, SessionSchema } from 'src/models/Session';
import { User, UserSchema } from 'src/models/User';
import { SessionsModule } from 'src/sessions/sessions.module';
import { TransformersModule } from 'src/transformers/transformers.module';
import { UserModule } from 'src/user/user.module';
import { SocketGateway } from './socket.gateway';
import { SocketRouter } from './socket.router';

@Module({
    imports:[MongooseModule.forFeature([
        {name:Session.name,schema:SessionSchema},
        {name:User.name,schema:UserSchema},
        {name:Message.name,schema:MessageSchema},
        {name:Chat.name,schema:ChatSchema}
      ]),
      AuthModule,
      UserModule,
      SessionsModule,
      TransformersModule
      //forwardRef(() => ChatModule)
    ],
    providers:[SocketGateway, SocketRouter],
    exports:[SocketRouter]
})
export class SocketModule {}
