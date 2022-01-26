import { Test, TestingModule } from '@nestjs/testing';
import { CpdlcService } from './cpdlc.service';

describe('CpdlcService', () => {
    let service: CpdlcService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({ providers: [CpdlcService] }).compile();

        service = module.get<CpdlcService>(CpdlcService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
