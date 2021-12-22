import { Test, TestingModule } from '@nestjs/testing';
import { WindsService } from './winds.service';

describe('WindsService', () => {
  let service: WindsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WindsService],
    }).compile();

    service = module.get<WindsService>(WindsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
