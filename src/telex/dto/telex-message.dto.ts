import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TelexMessageDto {
    @IsNotEmpty()
    @ApiProperty({ description: 'The number of the recipient flight', example: 'OS 355' })
    to: string;

    @IsNotEmpty()
    @ApiProperty({ description: 'The message to send', example: 'Hello over there!' })
    message: string;
}
