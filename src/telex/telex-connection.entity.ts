import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
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
  @ApiProperty({ description: 'Whether the connection is an active on or not' })
  isActive?: boolean;

  @CreateDateColumn()
  @ApiProperty({ description: 'The time of first contact' })
  firstContact?: Date;

  // TODO: Does not work?!
  @UpdateDateColumn()
  @ApiProperty({ description: 'The time of last contact' })
  lastContact?: Date;

  @Column()
  @ApiProperty({ description: 'The flight number', example: 'OS 355' })
  flight: string;

  @Column({
    type: 'point',
    nullable: true,
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
  @ApiProperty({ description: 'The current location of the aircraft' })
  location: Point;

  @Column()
  @ApiProperty({ description: 'The altitude above sea level of the aircraft in feet', example: 3500 })
  trueAltitude: number;

  @Column()
  @ApiProperty({ description: 'The heading the aircraft in degrees', example: 250.46, minimum: 0, maximum: 360 })
  heading: number;

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

  @IsOptional()
  @ApiProperty({ description: 'The destination of the flight', example: 'KSFO', required: false })
  destination?: string;
}

export class TelexConnectionDto extends TelexConnectionUpdateDto {
  @IsNotEmpty()
  @ApiProperty({ description: 'The flight number', example: 'OS 355' })
  flight: string;

  @IsOptional()
  @ApiProperty({ description: 'The origin of the flight', example: 'KLAX', required: false })
  origin?: string;
}
