import { Test, TestingModule } from '@nestjs/testing';
import { AtisController } from './atis.controller';

describe('AtisController', () => {
  let controller: AtisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AtisController],
    }).compile();

    controller = module.get<AtisController>(AtisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
