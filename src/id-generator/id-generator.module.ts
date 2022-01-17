import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IdGenerator, IdGeneratorSchema } from 'src/models/id-generator';
import { IdGeneratorService } from './id-generator.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IdGenerator.name, schema: IdGeneratorSchema },
    ]),
  ],
  providers: [IdGeneratorService],
  exports:[IdGeneratorService]
})
export class IdGeneratorModule {}
