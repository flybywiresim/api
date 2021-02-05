import { ApiProperty } from '@nestjs/swagger';

export class Charts {
  @ApiProperty({ description: 'The airport ICAO', example: 'KLAX' })
  icao: string;
}
