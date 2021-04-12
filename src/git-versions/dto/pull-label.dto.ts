import { ApiProperty } from '@nestjs/swagger';

export class PullLabel {
  @ApiProperty({ description: 'The unique identifier of the label', example: 'MDU6TGFiZWwyMzQ1OTA5MjAz' })
  id: string;

  @ApiProperty({ description: 'The name of the label', example: ['Ready to Test', 'QA Tier 2'] })
  name: string;

  @ApiProperty({ description: 'The hex color of the label', example: 'd93f0b' })
  color: string;
}
