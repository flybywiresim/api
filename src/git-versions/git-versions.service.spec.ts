import { Test, TestingModule } from '@nestjs/testing';
import { GitVersionsService } from './git-versions.service';

describe('GitVersionsService', () => {
    let service: GitVersionsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({ providers: [GitVersionsService] }).compile();

        service = module.get<GitVersionsService>(GitVersionsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
