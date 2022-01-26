import { Test, TestingModule } from '@nestjs/testing';
import { CpdlcController } from './cpdlc.controller';

describe('CpdlcController', () => {
    let controller: CpdlcController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({ controllers: [CpdlcController] }).compile();

        controller = module.get<CpdlcController>(CpdlcController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
