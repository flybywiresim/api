import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateTelexConnectionDto } from './update-telex-connection.dto';

export class CreateTelexConnectionDto extends UpdateTelexConnectionDto {
    @IsNotEmpty()
    @ApiProperty({ description: 'The flight number', example: 'OS 355' })
    flight: string;
}
