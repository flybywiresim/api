import { Test, TestingModule } from '@nestjs/testing';
import { AtisService } from './atis.service';

describe('AtisService', () => {
    let service: AtisService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({ providers: [AtisService] }).compile();

        service = module.get<AtisService>(AtisService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
