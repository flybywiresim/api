import { ApiProperty } from '@nestjs/swagger';
import { TelexConnection } from '../entities/telex-connection.entity';

export class TelexSearchResult {
    @ApiProperty({ description: 'A possible full text match' })
    fullMatch?: TelexConnection;

    @ApiProperty({ description: 'All possible matches', type: [TelexConnection] })
    matches: TelexConnection[];
}
