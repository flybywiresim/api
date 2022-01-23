import { ApiProperty } from '@nestjs/swagger';

export class Cpdlc {
    @ApiProperty({ description: 'The server\'s response', example: 'ok {}', })
    response: string;
}
