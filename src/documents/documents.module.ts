import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from 'src/models/File';
import { User, UserSchema } from 'src/models/User';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: File.name, schema: FileSchema },
    { name: User.name, schema: UserSchema }
  ]),],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports:[DocumentsService]
})
export class DocumentsModule {}
