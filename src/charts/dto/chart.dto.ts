import { ApiProperty } from '@nestjs/swagger';

export class Chart {
    @ApiProperty({ description: 'The chart URL', example: 'http://aeronav.faa.gov/d-tpp/2101/00237AD.PDF' })
    url: string;

    @ApiProperty({ description: 'The chart name', example: 'AIRPORT DIAGRAM for LAX' })
    name: string;
}
