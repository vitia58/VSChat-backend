import { Test, TestingModule } from '@nestjs/testing';
import { TransformersService } from './transformers.service';

describe('TransformersService', () => {
  let service: TransformersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformersService],
    }).compile();

    service = module.get<TransformersService>(TransformersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
