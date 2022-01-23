import { ApiProperty } from '@nestjs/swagger';

export class Cpdlc {
    @ApiProperty({ description: 'The Hoppie logon code', example: 'xxxxxxxxxx' })
    logon: string;

    @ApiProperty({ description: 'The server\'s response', example: 'ok {}', })
    response: string;
}
