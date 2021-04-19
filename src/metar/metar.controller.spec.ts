import { Test, TestingModule } from '@nestjs/testing';
import { MetarController } from './metar.controller';

describe('MetarController', () => {
    let controller: MetarController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({ controllers: [MetarController] }).compile();

        controller = module.get<MetarController>(MetarController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
