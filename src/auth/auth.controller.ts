import { Body, Controller, Get, Post } from '@nestjs/common';
import { ObjectIdvalidatorPipe } from 'src/pipes/object-idvalidator.pipe';
import { AuthService } from './auth.service';
import { CGoogleAuth } from './dto/CGoogleAuth';
import { CLoginDTO } from './dto/CLoginDTO';
import { CRegisterDTO } from './dto/CRegisterDTO';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService:AuthService
  ) { }

  @Post("login")
  async login(@Body(new ObjectIdvalidatorPipe) login:CLoginDTO){
    console.log(login)
    return this.authService.login(login);
  }
  @Post("register")
  async register(@Body(new ObjectIdvalidatorPipe) register:CRegisterDTO){
    console.log(register)
    return this.authService.register(register);
  }
  @Post("google")
  async google(@Body(new ObjectIdvalidatorPipe) google:CGoogleAuth){
    return this.authService.google(google)
  }
  @Get("test")
  async test(){
    return this.authService.test();
  }
}
