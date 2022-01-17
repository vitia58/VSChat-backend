import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'src/models/Chat';
import { ChatRoles, ChatRolesSchema } from 'src/models/ChatRoles';
import { ChatRolesService } from './chat-roles.service';
import { ChatRolesController } from './chat-roles.controller';

@Module({
  imports: [MongooseModule.forFeature([
    { name: ChatRoles.name, schema: ChatRolesSchema },
    { name: Chat.name, schema: ChatSchema }
  ]),],
  providers: [ChatRolesService],
  controllers: [ChatRolesController],
  exports:[ChatRolesService]
})
export class ChatRolesModule {}
