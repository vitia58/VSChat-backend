import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CUserDTO } from 'src/auth/dto/CUserDTO';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/decorators/user.decorator';
import { ObjectIdvalidatorPipe } from 'src/pipes/object-idvalidator.pipe';
import { ChatAccess, ChatGuard } from './chat.guard';
import { ChatService } from './chat.service';
import { CAddUserToChatDTO } from './dto/CAddUserToChatDTO';
import { CChangeMessageDTO } from './dto/CChangeMessageDTO';
import { CChatActionDTO } from './dto/CChatActionDTO';
import { CCreateChatDTO } from './dto/CCreateChatDTO';
import { CCreateChatWithUserDTO } from './dto/CCreateChatWithUserDTO';
import { CDeleteChatDTO } from './dto/CDeleteChatDTO';
import { CDeleteMessageDTO } from './dto/CDeleteMessageDTO';
import { CRemoveUserToChatDTO } from './dto/CRemoveUserToChatDTO';
import { CSendMessageDTO } from './dto/CSendMessageDTO';

@Controller('chat')
@UseGuards(JwtAuthGuard,ChatGuard)
export class ChatController {
    constructor(private readonly service:ChatService){}
    @Post("send")
    @ChatAccess()
    send(@Body(new ObjectIdvalidatorPipe()) message:CSendMessageDTO,@GetUser() user:CUserDTO){
        return this.service.send(message,user)
    }
    @Post("create")
    create(@Body(new ObjectIdvalidatorPipe()) chat:CCreateChatDTO,@GetUser() user:CUserDTO){
        return this.service.createChat(chat,user)
    }
    @Post("getByUser")
    async getByUser(@Body(new ObjectIdvalidatorPipe()) chat:CCreateChatWithUserDTO,@GetUser() user:CUserDTO){
        const res = await this.service.getByUser(chat,user)
        console.log(res)
        return res
    }
    @Get("message/:id")
    getMessage(@Param("id",new ObjectIdvalidatorPipe()) id:string,@GetUser() user:CUserDTO){
        return this.service.getMessage(id,user)
    }
    @Get("messages/:chat")
    @ChatAccess()
    getChatMessages(@Param("chat",new ObjectIdvalidatorPipe()) id:string,@GetUser() user:CUserDTO,@Query() q){
        return this.service.getChatMessages(id,user,(q.skip||null),(q.newest||null))
    }
    @Get("info/:chat")
    @ChatAccess()
    getChatInfo(@Param("chat",new ObjectIdvalidatorPipe()) id:string,@GetUser() user:CUserDTO){
        return this.service.getChatInfo(id,user)
    }
    @Get("list")
    list(@GetUser() user:CUserDTO){
        return this.service.list(user)
    }
    @ChatAccess()
    @Post("addUser")
    addUser(@Body(new ObjectIdvalidatorPipe()) addUserToChat:CAddUserToChatDTO,@GetUser() user:CUserDTO){
        return this.service.addUser(addUserToChat,user)
    }
    @ChatAccess()
    @Post("removeUser")
    removeUser(@Body(new ObjectIdvalidatorPipe()) removeUserToChat:CRemoveUserToChatDTO,@GetUser() user:CUserDTO){
        return this.service.removeUser(removeUserToChat,user)
    }
    @ChatAccess()
    @Post("leave")
    leave(@Body(new ObjectIdvalidatorPipe()) chatAction:CChatActionDTO,@GetUser() user:CUserDTO){
        return this.service.leave(chatAction,user)
    }
    @ChatAccess()
    @Post("mute")
    mute(@Body(new ObjectIdvalidatorPipe()) chatAction:CChatActionDTO,@GetUser() user:CUserDTO){
        return this.service.addUserToChatField(chatAction,user,"muted")
    }
    @ChatAccess()
    @Post("unmute")
    unmute(@Body(new ObjectIdvalidatorPipe()) chatAction:CChatActionDTO,@GetUser() user:CUserDTO){
        return this.service.removeUserToChatField(chatAction,user,"muted")
    }
    @ChatAccess()
    @Post("anchor")
    anchor(@Body(new ObjectIdvalidatorPipe()) chatAction:CChatActionDTO,@GetUser() user:CUserDTO){
        return this.service.addUserToChatField(chatAction,user,"anchored")
    }
    @ChatAccess()
    @Post("unanchor")
    unanchor(@Body(new ObjectIdvalidatorPipe()) chatAction:CChatActionDTO,@GetUser() user:CUserDTO){
        return this.service.removeUserToChatField(chatAction,user,"anchored")
    }
    @ChatAccess()
    @Post("readAll")
    readAll(@Body(new ObjectIdvalidatorPipe()) chatAction:CChatActionDTO,@GetUser() user:CUserDTO){
        return this.service.readAll(chatAction,user)
    } 
    @ChatAccess()
    @Delete("chat")
    deleteChat(@Body(new ObjectIdvalidatorPipe()) deleteChat:CDeleteChatDTO,@GetUser() user:CUserDTO){
        return this.service.deleteChat(deleteChat,user)
    }
    @Delete("message")
    deleteMessage(@Body(new ObjectIdvalidatorPipe()) deleteMessage:CDeleteMessageDTO,@GetUser() user:CUserDTO){
        return this.service.deleteMessage(deleteMessage,user)
    }
    @Post("change/message")
    changeMessage(@Body(new ObjectIdvalidatorPipe()) changeMessage:CChangeMessageDTO,@GetUser() user:CUserDTO){
        return this.service.changeMessage(changeMessage,user)
    }
    @Post("clear")
    clear(){
      return this.service.clear()
    }
}
