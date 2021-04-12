import { ApiProperty } from '@nestjs/swagger';

export class Taf {
  @ApiProperty({ description: 'The airport ICAO', example: 'KLAX' })
  icao: string;

  @ApiProperty({
      description: 'The TAF notice',
      example: 'KLAX 242119Z 2421/2524 28011KT P6SM SCT029 OVC040 FM250500 26007KT P6SM OVC030 '
      + 'FM250900 25007KT P6SM OVC035 FM251800 25010KT P6SM OVC040 FM252100 25013KT P6SM BKN045',
  })
  taf: string;

  @ApiProperty({ description: 'The source of the TAF notice', enum: ['aviationweather', 'faa'] })
  source: string;
}
