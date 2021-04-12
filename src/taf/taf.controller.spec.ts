import { Test, TestingModule } from '@nestjs/testing';
import { TafController } from './taf.controller';

describe('TafController', () => {
    let controller: TafController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({ controllers: [TafController] }).compile();

        controller = module.get<TafController>(TafController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
