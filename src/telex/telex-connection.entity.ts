import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class Point {
  @ApiProperty({ description: 'The X coordinate' })
  x: number;

  @ApiProperty({ description: 'The Y coordinate' })
  y: number;
}

@Entity()
export class TelexConnection {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'The unique identifier of the connection',
    example: '6571f19e-21f7-4080-b239-c9d649347101',
  })
  id?: string;

  @Column({ default: true })
  @Index()
  @ApiProperty({ description: 'Whether the connection is an active on or not' })
  isActive?: boolean;

  @CreateDateColumn()
  @ApiProperty({ description: 'The time of first contact' })
  firstContact?: Date;

  @UpdateDateColumn()
  @Index()
  @ApiProperty({ description: 'The time of last contact' })
  lastContact?: Date;

  @Column({ update: false })
  @Index()
  @ApiProperty({ description: 'The flight number', example: 'OS 355' })
  flight: string;

  @Column({
    type: 'point',
    nullable: false,
    transformer: {
      from: v => {
        return {
          x: Number(v.split(' ')[0].slice(6)),
          y: Number(v.split(' ')[1].slice(0, -1)),
        };
      },
      to: v => `POINT(${v.x} ${v.y})`,
    },
  })
  @Index({ spatial: true })
  @ApiProperty({ description: 'The current location of the aircraft' })
  location: Point;

  @Column()
  @ApiProperty({ description: 'The altitude above sea level of the aircraft in feet', example: 3500 })
  trueAltitude: number;

  @Column()
  @ApiProperty({ description: 'The heading the aircraft in degrees', example: 250.46, minimum: 0, maximum: 360 })
  heading: number;

  @Column()
  @ApiProperty({ description: 'Whether the user wants to receive freetext messages', example: true })
  freetextEnabled: boolean;

  @Column()
  @ApiProperty({ description: 'The aircraft type the connection associated with', example: 'A32NX' })
  aircraftType?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'The origin of the flight', example: 'KLAX', required: false })
  origin?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'The destination of the flight', example: 'KSFO', required: false })
  destination?: string;
}

export class TelexConnectionUpdateDto {
  @IsNotEmpty()
  @ApiProperty({ description: 'The current location of the aircraft' })
  location: Point;

  @IsNotEmpty()
  @ApiProperty({ description: 'The altitude above sea level of the aircraft in feet', example: 3500 })
  trueAltitude: number;

  @IsNotEmpty()
  @ApiProperty({ description: 'The heading the aircraft in degrees', example: 250.46, minimum: 0, maximum: 360 })
  heading: number;

  // Set it to true to support the old MCDU implementation (0.4.1)
  // 0.4.1 does this check in the frontend
  // TODO: Remove the default value after 0.5.0 release
  @IsOptional()
  @ApiProperty({ description: 'Whether the user wants to receive freetext messages', example: true })
  freetextEnabled = true;

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

export class TelexConnectionDto extends TelexConnectionUpdateDto {
  @IsNotEmpty()
  @ApiProperty({ description: 'The flight number', example: 'OS 355' })
  flight: string;
}

export class TelexConnectionPaginatedDto {
  @IsNotEmpty()
  @ApiProperty({ description: 'List of TELEX connections', type: [TelexConnection] })
  results: TelexConnection[];

  @IsNotEmpty()
  @ApiProperty({ description: 'Amount of connections returned', example: '25' })
  count: number;

  @IsNotEmpty()
  @ApiProperty({ description: 'The number of total active connections in database', example: '1237' })
  total: number;
}
