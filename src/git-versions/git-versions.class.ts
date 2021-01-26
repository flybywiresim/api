import { ApiProperty } from '@nestjs/swagger';

export class CommitInfo {
  @ApiProperty({ description: 'The commit hash', example: '5160ea16c15868251f97ba4489304f328caafa8c' })
  sha: string;

  @ApiProperty({ description: 'The time the commit was created' })
  timestamp: Date;
}

export class ReleaseInfo {
  @ApiProperty({ description: 'The name of the release', example: 'v0.5.1' })
  name: string;

  @ApiProperty({ description: 'The publish timestamp of the release' })
  publishedAt: Date;

  @ApiProperty({ description: 'The URL of the release page on GitHub' })
  htmlUrl: string;
}

export class PullInfo {
  @ApiProperty({ description: 'The number of the PR', example: '3176' })
  number: number;

  @ApiProperty({ description: 'The title of the PR', example: 'feat: brake fan' })
  title: string;

  @ApiProperty({ description: 'The username of the author', example: 'tyler58546' })
  author: string;

  @ApiProperty({ description: 'The labels on the PR', example: ['Ready to Test', 'QA Tier 2']})
  labels: string[];

  @ApiProperty({ description: 'Whether the PR is still a draft' })
  isDraft: boolean;
}
