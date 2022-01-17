import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CLoginDTO } from './dto/CLoginDTO';
import { CRegisterDTO } from './dto/CRegisterDTO';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService:AuthService
  ) { }

  @Post("login")
  async login(@Body() login:CLoginDTO){
    console.log(login)
    return this.authService.login(login);
  }
  @Post("register")
  async register(@Body() register:CRegisterDTO){
    console.log(register)
    return this.authService.register(register);
  }
  @Get("test")
  async test(){
    return this.authService.test();
  }
}
