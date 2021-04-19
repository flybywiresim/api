import { Test, TestingModule } from '@nestjs/testing';
import { TelexConnectionController } from './telex-connection.controller';

describe('TelexController', () => {
    let controller: TelexConnectionController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({ controllers: [TelexConnectionController] }).compile();

        controller = module.get<TelexConnectionController>(TelexConnectionController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
