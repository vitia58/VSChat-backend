import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IdGenerator, IdGeneratorDocument } from 'src/models/id-generator';

@Injectable()
export class IdGeneratorService {
    constructor(
      @InjectModel(IdGenerator.name)
      private readonly idGeneratorModel: Model<IdGeneratorDocument>,
    ) {}
    async generateIdForUser(){
        const {user} = await this.idGeneratorModel.findOneAndUpdate(
            { id: 1 },
            {
              $inc: {
                user: 1,
              },
            },
            { new: true, upsert: true },
          )
        return user
    }
}
