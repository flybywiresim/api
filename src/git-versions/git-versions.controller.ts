import { CacheInterceptor, CacheTTL, Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { GitVersionsService } from './git-versions.service';
import { Observable } from 'rxjs';
import { CommitInfo, PullInfo, ReleaseInfo } from './git-versions.class';

@ApiTags('Git Versions')
@Controller('api/v1/git-versions')
@UseInterceptors(CacheInterceptor)
export class GitVersionsController {
  constructor(private service: GitVersionsService) {
  }

  @Get(':user/:repo/branches/:branch')
  @CacheTTL(300)
  @ApiParam({ name: 'user', description: 'The owner of the repository', example: 'flybywiresim' })
  @ApiParam({ name: 'repo', description: 'The repository', example: 'a32nx' })
  @ApiParam({ name: 'branch', description: 'The target branch', example: 'master' })
  @ApiOkResponse({ description: 'The newest commit on the branch', type: CommitInfo })
  getCommitOfBranch(@Param('user') user: string, @Param('repo') repo: string, @Param('branch') branch: string): Observable<CommitInfo> {
    return this.service.getCommitOfBranch(user, repo, branch);
  }

  @Get(':user/:repo/releases')
  @CacheTTL(300)
  @ApiParam({ name: 'user', description: 'The owner of the repository', example: 'flybywiresim' })
  @ApiParam({ name: 'repo', description: 'The repository', example: 'a32nx' })
  @ApiOkResponse({ description: 'The newest commit on the branch', type: [ReleaseInfo]})
  getReleases(@Param('user') user: string, @Param('repo') repo: string): Observable<ReleaseInfo[]> {
    return this.service.getReleases(user, repo);
  }

  @Get(':user/:repo/pulls')
  @CacheTTL(60)
  @ApiParam({ name: 'user', description: 'The owner of the repository', example: 'flybywiresim' })
  @ApiParam({ name: 'repo', description: 'The repository', example: 'a32nx' })
  @ApiOkResponse({ description: 'The newest commit on the branch', type: [PullInfo]})
  getPulls(@Param('user') user: string, @Param('repo') repo: string): Observable<PullInfo[]> {
    return this.service.getPulls(user, repo);
  }

}
