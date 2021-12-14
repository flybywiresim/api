import { CacheInterceptor, CacheTTL, Controller, Get, Param, Query, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GitVersionsService } from './git-versions.service';
import { ReleaseInfo } from './dto/release-info.dto';
import { PullInfo } from './dto/pull-info.dto';
import { CommitInfo } from './dto/commit-info.dto';
import { ArtifactInfo } from './dto/artifact-info.dto';
import { PaginationDto } from '../common/Pagination';

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
                shortSha: '',
                timestamp: new Date(),
            };
        }
    }

  @Get(':user/:repo/releases')
  @CacheTTL(300)
  @ApiParam({ name: 'user', description: 'The owner of the repository', example: 'flybywiresim' })
  @ApiParam({ name: 'repo', description: 'The repository', example: 'a32nx' })
  @ApiQuery({
      name: 'take',
      type: Number,
      required: false,
      description: 'The number of releases to take',
      schema: { maximum: 25, minimum: 0, default: 25 },
  })
  @ApiQuery({
      name: 'skip',
      type: Number,
      required: false,
      description: 'The number of releases to skip',
      schema: { minimum: 0, default: 0 },
  })
  @ApiQuery({
      name: 'includePreReleases',
      description: 'Whether to include pre-releases in the list',
      required: false,
      enum: ['true', 'false'],
      schema: { default: false },
  })
  @ApiOkResponse({ description: 'The paginated releases', type: [ReleaseInfo] })
  async getReleases(
    @Param('user') user: string,
    @Param('repo') repo: string,
    @Query('includePreReleases') includePre: string,
    @Query(new ValidationPipe({ transform: true })) pagination: PaginationDto,
  ): Promise<ReleaseInfo[]> {
      try {
          return await this.service.getReleases(user, repo, includePre === undefined ? false : includePre === 'true', pagination).toPromise();
      } catch (e) {
          return [];
      }
  }

  @Get(':user/:repo/pulls')
  @CacheTTL(60)
  @ApiParam({ name: 'user', description: 'The owner of the repository', example: 'flybywiresim' })
  @ApiParam({ name: 'repo', description: 'The repository', example: 'a32nx' })
  @ApiOkResponse({ description: 'The newest PRs of the repo', type: [PullInfo] })
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
          return { artifactUrl: '' };
      }
  }
}
