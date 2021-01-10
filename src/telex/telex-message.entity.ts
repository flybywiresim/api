import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TelexConnection } from './telex-connection.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

@Entity()
export class TelexMessage {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'The unique identifier of the message', example: '6571f19e-21f7-4080-b239-c9d649347101' })
  id?: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'The time the message was sent' })
  createdAt?: Date;

  @Column({ default: false })
  @ApiProperty({ description: 'Whether the message has been received' })
  received?: boolean;

  @Column()
  @ApiProperty({ description: 'The message to send', example: 'Hello over there!' })
  message: string;

  @Column()
  @ApiProperty({ description: 'Whether the message contains profanity and got filtered' })
  isProfane: boolean;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne(type => TelexConnection, x => x.id, { eager: true })
  @ApiProperty({ description: 'The sender connection' })
  from: TelexConnection;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne(type => TelexConnection, x => x.id, { eager: true })
  @ApiProperty({ description: 'The recipient connection' })
  to: TelexConnection;
}

export class TelexMessageDto {
  @IsNotEmpty()
  @ApiProperty({ description: 'The number of the recipient flight', example: 'OS 355' })
  to: string;

  @IsNotEmpty()
  @ApiProperty({ description: 'The message to send', example: 'Hello over there!' })
  message: string;
}
