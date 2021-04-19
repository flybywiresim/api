import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class AirportAugmentation {
  @PrimaryGeneratedColumn()
  @ApiProperty({
      description: 'The unique identifier of the airport',
      example: '1234',
  })
  id?: number;

  @Column({ default: '' })
  @Index({ unique: true })
  @ApiProperty({ description: 'The icao of the airport' })
  icao: string;

  @Column({ default: -1 })
  @ApiProperty({ description: 'The transition altitude of the airport' })
  transAlt?: number;
}
