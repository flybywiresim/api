import { CacheInterceptor, CacheTTL, Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { GitVersionsService } from './git-versions.service';
import { ArtifactInfo, CommitInfo, PullInfo, ReleaseInfo } from './git-versions.class';

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
  async getCommitOfBranch(@Param('user') user: string, @Param('repo') repo: string, @Param('branch') branch: string): Promise<CommitInfo> {
    try {
      return await this.service.getCommitOfBranch(user, repo, branch).toPromise();
    } catch (e) {
      return {
        sha: '',
        timestamp: new Date(),
      };
    }
  }

  @Get(':user/:repo/releases')
  @CacheTTL(300)
  @ApiParam({ name: 'user', description: 'The owner of the repository', example: 'flybywiresim' })
  @ApiParam({ name: 'repo', description: 'The repository', example: 'a32nx' })
  @ApiOkResponse({ description: 'The newest commit on the branch', type: [ReleaseInfo]})
  async getReleases(@Param('user') user: string, @Param('repo') repo: string): Promise<ReleaseInfo[]> {
    try {
      return await this.service.getReleases(user, repo).toPromise();
    } catch (e) {
      return [];
    }
  }

  @Get(':user/:repo/pulls')
  @CacheTTL(60)
  @ApiParam({ name: 'user', description: 'The owner of the repository', example: 'flybywiresim' })
  @ApiParam({ name: 'repo', description: 'The repository', example: 'a32nx' })
  @ApiOkResponse({ description: 'The newest commit on the branch', type: [PullInfo]})
  async getPulls(@Param('user') user: string, @Param('repo') repo: string): Promise<PullInfo[]> {
    try {
      return await this.service.getPulls(user, repo).toPromise();
    } catch (e) {
      return [];
    }
  }

  @Get(':user/:repo/pulls/:pull/artifact')
  @CacheTTL(60)
  @ApiParam({ name: 'user', description: 'The owner of the repository', example: 'flybywiresim' })
  @ApiParam({ name: 'repo', description: 'The repository', example: 'a32nx' })
  @ApiParam({ name: 'pull', description: 'The number of the PR', example: '3295' })
  @ApiOkResponse({ description: 'The artifact URL for this PR', type: ArtifactInfo })
  async getArtifact(@Param('user') user: string, @Param('repo') repo: string, @Param('pull') pull: string): Promise<ArtifactInfo> {
    try {
      return await this.service.getArtifactForPull(user, repo, pull);
    } catch (e) {
      return {
        artifactUrl: '',
      };
    }
  }

}
