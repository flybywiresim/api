import { ApiProperty } from '@nestjs/swagger';

export enum AtcType {
  UNKNOWN,
  DELIVERY,
  GROUND,
  TOWER,
  DEPARTURE,
  APPROACH,
  RADAR,
  ATIS
}

export class ATCInfo {
  @ApiProperty({ description: 'The atc callsign', example: 'EBBR_TWR' })
  callsign: string;

  @ApiProperty({ description: 'The atc frequency', example: '128.800' })
  frequency: string;

  @ApiProperty({ description: 'The atc visual range', example: 150 })
  visualRange: number;

  @ApiProperty({ description: 'The atc current ATIS', example: ['line 1', 'line2', 'line3'] })
  textAtis: string[];

  @ApiProperty({ description: 'The atc type', example: 'GND' })
  type: AtcType;

  @ApiProperty({ description: 'The atc latitude', example: 32.08420727935125 })
  latitude?: number;

  @ApiProperty({ description: 'The atc longitude', example: -81.14929543157402 })
  longitude?: number;
}
