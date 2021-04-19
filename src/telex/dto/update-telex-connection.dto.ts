import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Point } from '../entities/point.entity';

export class UpdateTelexConnectionDto {
    @IsNotEmpty()
    @ApiProperty({ description: 'The current location of the aircraft' })
    location: Point;

    @IsNotEmpty()
    @ApiProperty({ description: 'The altitude above sea level of the aircraft in feet', example: 3500 })
    trueAltitude: number;

    @IsNotEmpty()
    @ApiProperty({ description: 'The heading the aircraft in degrees', example: 250.46, minimum: 0, maximum: 360 })
    heading: number;

    @IsOptional()
    @ApiProperty({ description: 'Whether the user wants to receive freetext messages', example: true })
    freetextEnabled: boolean;

    @IsOptional()
    @ApiProperty({ description: 'The aircraft type the connection associated with', example: 'A32NX' })
    aircraftType = 'unknown';

    @IsOptional()
    @ApiProperty({ description: 'The destination of the flight', example: 'KSFO', required: false })
    destination?: string;

    @IsOptional()
    @ApiProperty({ description: 'The origin of the flight', example: 'KLAX', required: false })
    origin?: string;
}
