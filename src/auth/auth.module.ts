import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../models/User';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { Session, SessionSchema } from 'src/models/Session';
import { DocumentsModule } from 'src/documents/documents.module';
import { VerificationModule } from 'src/verification/verification.module';
import { IdGeneratorModule } from 'src/id-generator/id-generator.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name:User.name,schema:UserSchema},
      {name:Session.name,schema:SessionSchema},
    ]),
    VerificationModule,
    UserModule,
    DocumentsModule,
    PassportModule,
    IdGeneratorModule,
    JwtModule.register({
      secret: "0864213579aZ",
      signOptions: { expiresIn: '365d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports:[AuthService]
})
export class AuthModule {}
