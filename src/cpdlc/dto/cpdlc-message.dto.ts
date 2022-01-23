import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CpdlcMessageDto {
    @IsNotEmpty()
    @ApiProperty({ description: 'The Hoppie logon code', example: 'xxxxxxxxxx' })
    logon: string;

    @IsNotEmpty()
    @ApiProperty({ description: 'The from-callsign', example: 'DLH8HM' })
    from: string;

    @IsNotEmpty()
    @ApiProperty({ description: 'The to-callsign', example: 'ALL-CALLSIGNS' })
    to: string

    @IsNotEmpty()
    @ApiProperty({ description: 'The request type', example: 'poll' })
    type: string;

    @IsOptional()
    @ApiProperty({ description: 'The message content', example: 'data2//1/Hello' })
    packet: string;
}
