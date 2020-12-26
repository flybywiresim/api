import { ApiProperty } from '@nestjs/swagger';

export class Metar {
  @ApiProperty({ description: 'The airport ICAO', example: 'KLAX' })
  icao: string;

  @ApiProperty({
    description: 'The TAF notice',
    example: 'KLAX 242253Z 26012KT 10SM FEW025 SCT043 BKN240 20/12 A2993 RMK AO2 SLP134 T02000122'
  })
  metar: string;

  @ApiProperty({description: 'The source of the METAR notice', enum: ['vatsim', 'ms', 'ivao', 'pilotedge'] })
  source: string;
}
