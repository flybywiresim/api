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

export class PullLabel {
  @ApiProperty({ description: 'The unique identifier of the label', example: 'MDU6TGFiZWwyMzQ1OTA5MjAz' })
  id: string;

  @ApiProperty({ description: 'The name of the label', example: ['Ready to Test', 'QA Tier 2']})
  name: string;

  @ApiProperty({ description: 'The hex color of the label', example: 'd93f0b' })
  color: string;
}

export class PullInfo {
  @ApiProperty({ description: 'The number of the PR', example: '3176' })
  number: number;

  @ApiProperty({ description: 'The title of the PR', example: 'feat: brake fan' })
  title: string;

  @ApiProperty({ description: 'The username of the author', example: 'tyler58546' })
  author: string;

  @ApiProperty({ description: 'The labels on the PR' })
  labels: PullLabel[];

  @ApiProperty({ description: 'Whether the PR is still a draft' })
  isDraft: boolean;
}

export class ArtifactInfo {
  @ApiProperty({ description: 'URL of the artifact', example: 'https://.../zip' })
  artifactUrl: string;
}
