import { ApiProperty } from '@nestjs/swagger';

export class ReleaseInfo {
  @ApiProperty({ description: 'The name of the release', example: 'v0.5.1' })
  name: string;

  @ApiProperty({ description: 'Whether the release is a pre-release' })
  isPreRelease: boolean;

  @ApiProperty({ description: 'The publish timestamp of the release' })
  publishedAt: Date;

  @ApiProperty({ description: 'The URL of the release page on GitHub' })
  htmlUrl: string;

  @ApiProperty({ description: 'Markdown formatted body of the release' })
  body: string;
}
