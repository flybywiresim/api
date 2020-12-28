import { Test, TestingModule } from '@nestjs/testing';
import { GitVersionsController } from './git-versions.controller';

describe('GitVersionsController', () => {
  let controller: GitVersionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GitVersionsController],
    }).compile();

    controller = module.get<GitVersionsController>(GitVersionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
