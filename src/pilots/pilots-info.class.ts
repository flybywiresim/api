import { ApiProperty } from '@nestjs/swagger';

export class PilotsInfo {
  @ApiProperty({ description: 'The atc callsign', example: 'EBBR_TWR' })
  callsign: string;

  @ApiProperty({ description: 'The atc frequency', example: '128.800' })
  altitude: number;

  @ApiProperty({ description: 'The atc latitude', example: 32.08420727935125 })
  latitude: number;

  @ApiProperty({ description: 'The atc longitude', example: -81.14929543157402 })
  longitude: number;
}
