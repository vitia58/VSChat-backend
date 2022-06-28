import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { SocketModule } from './socket/socket.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SessionsModule } from './sessions/sessions.module';
import { __DEV__ } from './helpers/constant';
import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { VerificationModule } from './verification/verification.module';
import { IdGeneratorModule } from './id-generator/id-generator.module';
import { TransformersModule } from './transformers/transformers.module';
import { ChatRolesModule } from './chat-roles/chat-roles.module';
import { LoggerMiddleware } from './middlewares/logger.middleware';

@Module({
  imports: [AuthModule,
    ConfigModule.forRoot({
      envFilePath: __DEV__?'dev.env':'prod.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ChatModule,
    SocketModule,
    DocumentsModule,
    NotificationsModule,
    UserModule,
    SessionsModule,
    ProfileModule,
    VerificationModule,
    IdGeneratorModule,
    TransformersModule,
    ChatRolesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('chat/*');
  }
}
