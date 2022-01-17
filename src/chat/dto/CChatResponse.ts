import { CChatRoles } from "src/chat-roles/dto/CChatRoles";

export type CChatResponse = {
    id: string;
    title: string;
    image: string;
    users: CChatRoles;
    lastMessage: CMessageResponse|null;
    unreaded: number;
    isGroup:boolean;
    opened:string[]
    typping:string[]
    muted:boolean
    anchored:boolean
}