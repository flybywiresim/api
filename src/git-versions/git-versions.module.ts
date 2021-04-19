import { HttpModule, Module } from '@nestjs/common';
import { GitVersionsService } from './git-versions.service';
import { GitVersionsController } from './git-versions.controller';

@Module({
    imports: [HttpModule],
    providers: [GitVersionsService],
    controllers: [GitVersionsController],
})
export class GitVersionsModule {}
