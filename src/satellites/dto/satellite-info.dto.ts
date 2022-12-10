import { ApiProperty } from '@nestjs/swagger';

export class SatelliteInfo {
    @ApiProperty({ description: 'The name of the satellite', example: 'GPS BIIR-2  (PRN 13)' })
    name: string;

    @ApiProperty()
    id: string;

    @ApiProperty()
    epoch: Date;

    @ApiProperty()
    meanMotion: number;

    @ApiProperty()
    eccentricity: number;

    @ApiProperty()
    inclination: number;

    @ApiProperty()
    raOfAscNode: number;

    @ApiProperty()
    argOfPericenter: number;

    @ApiProperty()
    meanAnomaly: number;

    @ApiProperty()
    ephemerisType: number;

    @ApiProperty()
    classificationType: string;

    @ApiProperty()
    noradCatId: number;

    @ApiProperty()
    elementSetNo: number;

    @ApiProperty()
    revAtEpoch: number;

    @ApiProperty()
    bstar: number;

    @ApiProperty()
    meanMotionDot: number;

    @ApiProperty()
    meanMotionDdot: number;
}
