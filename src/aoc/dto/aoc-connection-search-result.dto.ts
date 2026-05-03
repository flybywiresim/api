import { ApiProperty } from '@nestjs/swagger';
import { AocConnection } from '../entities/aoc-connection.entity';

export class AocConnectionSearchResultDto {
    @ApiProperty({ description: 'A possible full text match' })
    fullMatch?: AocConnection;

    @ApiProperty({ description: 'All possible matches', type: [AocConnection] })
    matches: AocConnection[];
}
