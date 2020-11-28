import { Test, TestingModule } from '@nestjs/testing';
import { AirportController } from './airport.controller';

describe('AirportController', () => {
  let controller: AirportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AirportController],
    }).compile();

    controller = module.get<AirportController>(AirportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
