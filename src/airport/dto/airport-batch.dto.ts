import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AirportBatchDto {
  @IsNotEmpty()
  @ApiProperty({ description: 'The ICAOs to fetch', example: ['KLAX', 'KSFO'] })
  icaos: string[];
}
