import { forwardRef, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OneSignalModule } from 'onesignal-api-client-nest';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from 'src/models/Session';
import { Chat, ChatSchema } from 'src/models/Chat';
import { User, UserSchema } from 'src/models/User';
import { Message, MessageSchema } from 'src/models/Message';
import { ChatModule } from 'src/chat/chat.module';
import { NotificationsController } from './notifications.controller';
import { UserModule } from 'src/user/user.module';
import { SocketModule } from 'src/socket/socket.module';
import { Notification, NotificationSchema } from 'src/models/Notification';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Notification.name, schema: NotificationSchema },
      // { name: User.name, schema: UserSchema }
    ]),
    ConfigModule,
    OneSignalModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        appId: configService.get('ONESIGNAL_APP_ID'),
        restApiKey: configService.get('ONESIGNAL_REST_API_KEY'),
      }),
      inject: [ConfigService],
    }),
    forwardRef(()=>ChatModule),
    UserModule,
    SocketModule
  ],
  providers: [NotificationsService],
  exports:[NotificationsService],
  controllers: [NotificationsController]
})
export class NotificationsModule { }
