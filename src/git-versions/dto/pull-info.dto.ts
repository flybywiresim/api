import { ApiProperty } from '@nestjs/swagger';
import { PullLabel } from './pull-label.dto';

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
