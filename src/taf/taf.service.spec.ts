import { Test, TestingModule } from '@nestjs/testing';
import { TafService } from './taf.service';

describe('TafService', () => {
  let service: TafService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TafService],
    }).compile();

    service = module.get<TafService>(TafService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
