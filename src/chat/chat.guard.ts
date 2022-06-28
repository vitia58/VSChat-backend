import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { isMongoId } from 'class-validator';
import { Model } from 'mongoose';
import { Observable } from 'rxjs';
import { Chat, ChatDocument } from 'src/models/Chat';

export const ChatAccess = (chatField:string = "chat") => SetMetadata('chat', chatField);
@Injectable()
export class ChatGuard implements CanActivate {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
    private reflector: Reflector
    ){}
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const chatField = this.reflector.get<string>('chat', context.getHandler());
    if(!chatField)return true

    const chatId = request.body[chatField]||request.params[chatField].split("&")[0]
    // console.log(request,request.body[chatField],request.params[chatField])
    if(chatId&&chatId!==undefined&&isMongoId(chatId)){
      const chat = await this.chatModel.findById(chatId).exec()
      request.body.chat = chat
      
      const user = request?.user
      if (chat) {
        if (chat.users.find(u => u._id || u + "" == user._id + "")) {
            return true
        } else throw new ForbiddenException("Access denied")
      } else throw new NotFoundException("Chat not found")
    }else{
      console.log("body:",request.body,"params",request.params[chatField])
      throw new NotFoundException("Chat not found")
    }
  }
}
