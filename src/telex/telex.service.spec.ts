import { Test, TestingModule } from '@nestjs/testing';
import { TelexService } from './telex.service';

describe('TelexService', () => {
    let service: TelexService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({ providers: [TelexService] }).compile();

        service = module.get<TelexService>(TelexService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
