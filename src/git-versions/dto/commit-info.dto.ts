import { ApiProperty } from '@nestjs/swagger';

export class CommitInfo {
  @ApiProperty({ description: 'The commit hash', example: '5160ea16c15868251f97ba4489304f328caafa8c' })
  sha: string;

  @ApiProperty({ description: 'The shortened commit hash', example: '5160ea1' })
  shortSha: string;

  @ApiProperty({ description: 'The time the commit was created' })
  timestamp: Date;
}
