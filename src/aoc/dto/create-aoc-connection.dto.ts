import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateAocConnectionDto } from './update-aoc-connection.dto';

export class CreateAocConnectionDto extends UpdateAocConnectionDto {
    @IsNotEmpty()
    @ApiProperty({ description: 'The flight number', example: 'OS355' })
    flight: string;
}
