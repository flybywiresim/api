import { ApiProperty } from '@nestjs/swagger';

export class Point {
    @ApiProperty({ description: 'The X coordinate' })
    x: number;

    @ApiProperty({ description: 'The Y coordinate' })
    y: number;
}
