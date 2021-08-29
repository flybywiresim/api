import { Test, TestingModule } from '@nestjs/testing';
import { WindsController } from './winds.controller';
import { WindsService } from './winds.service';

describe('WindsController', () => {
  let controller: WindsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WindsController],
      providers: [WindsService],
    }).compile();

    controller = module.get<WindsController>(WindsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
