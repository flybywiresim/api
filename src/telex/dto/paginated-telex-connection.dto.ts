import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TelexConnection } from '../entities/telex-connection.entity';

export class PaginatedTelexConnectionDto {
    @IsNotEmpty()
    @ApiProperty({ description: 'List of TELEX connections', type: [TelexConnection] })
    results: TelexConnection[];

    @IsNotEmpty()
    @ApiProperty({ description: 'Amount of connections returned', example: '25' })
    count: number;

    @IsNotEmpty()
    @ApiProperty({ description: 'The number of total active connections in the boundary', example: '1237' })
    total: number;
}
