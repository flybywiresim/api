import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class AirportAugmentation {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'The unique identifier of the airport',
    example: '6571f19e-21f7-4080-b239-c9d649347101',
  })
  id?: string;

  @Column({ default: '' })
  @Index()
  @ApiProperty({ description: 'The icao of the airport' })
  icao: string;

  @Column({ default: -1 })
  @ApiProperty({ description: 'The transition altitude of the airport' })
  transAlt?: number;
}
