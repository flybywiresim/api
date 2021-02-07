import { ApiProperty } from '@nestjs/swagger';

export class Charts {
  @ApiProperty({ description: 'The airport ICAO', example: 'KLAX' })
  icao: string;

  @ApiProperty({
    description: 'The list of chart URLs',
    example: [
      "http://aeronav.faa.gov/d-tpp/2101/00237AD.PDF",
      "http://aeronav.faa.gov/d-tpp/2101/SW3TO.PDF"
    ]
  })
  charts?: string[];
}
