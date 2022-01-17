import { IsString } from 'class-validator';
import { Session } from 'src/models/Session';
import { User } from 'src/models/User';
export type CUserDTO = Omit<User, "password"|"__v"> & {session:Session,id:string}