import { Controller, Get, Post } from '@nestjs/common';
import { ChatRolesService } from './chat-roles.service';

@Controller('chat-roles')
export class ChatRolesController {
    constructor(private readonly service:ChatRolesService){}
    @Post("test")
    test(){
        return this.service.getChatByIdRoles("618d5b6913b4b2721e86a86e")
        // this.service.setRole("6187d168f0f5222a39d2f796","618d5b6913b4b2721e86a86e","Back-ender","admin")
    }
}
