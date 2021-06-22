import { ApiProperty } from '@nestjs/swagger';

export class PilotInfo {
  @ApiProperty({ description: 'The pilot callsign', example: 'AUL1234' })
  callsign: string;

  @ApiProperty({ description: 'the pilot name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'The pilot latitude', example: 32.08420727935125 })
  latitude?: number;

  @ApiProperty({ description: 'The pilot longitude', example: -81.14929543157402 })
  longitude?: number;

  @ApiProperty({ description: 'The plane altitude', example: 15000 })
  altitude:number;

  @ApiProperty({ description: 'The plane heading', example: 247 })
  heading:number;

  @ApiProperty({ description: 'The plane ground speed', example: 250 })
  groundspeed:number;

  @ApiProperty({ description: 'the plane departure airport', example: 'EBBR' })
  departure: string;

  @ApiProperty({ description: 'the plane arrival airport', example: 'EDDL' })
  arrival: string;

  @ApiProperty({ description: 'the plane type', example: 'A20N/L' })
  aircraft: string;
}
