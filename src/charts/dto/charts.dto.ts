import { ApiProperty } from '@nestjs/swagger';
import { Chart } from './chart.dto';

export class Charts {
  @ApiProperty({ description: 'The airport ICAO', example: 'KLAX' })
  icao: string;

  @ApiProperty({ description: 'The list of chart URLs', type: Chart })
  charts?: Chart[];
}
