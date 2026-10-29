import { ApiProperty } from '@nestjs/swagger';
import { AocConnection } from '../entities/aoc-connection.entity';

export class PaginatedAocConnectionDto {
    @ApiProperty({ description: 'List of AOC connections', type: [AocConnection] })
    results: AocConnection[];

    @ApiProperty({ description: 'Amount of connections returned', example: 25 })
    count: number;

    @ApiProperty({ description: 'The number of total active connections in the boundary', example: 1237 })
    total: number;
}
