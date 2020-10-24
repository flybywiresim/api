import { Test, TestingModule } from '@nestjs/testing';
import { MetarService } from './metar.service';

describe('MetarService', () => {
  let service: MetarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetarService],
    }).compile();

    service = module.get<MetarService>(MetarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
