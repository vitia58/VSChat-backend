import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import { ChatDocument } from 'src/models/Chat';

export const GetChat = createParamDecorator((data, host:ExecutionContext) => {
  const ctx = host.switchToHttp()
  const req = ctx.getRequest<Request&{chat:ChatDocument}>()
  return req.chat;
});