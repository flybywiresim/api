import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TelexConnection } from './telex-connection.entity';

@Entity()
export class TelexMessage {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @Column({ default: false })
  received?: boolean;

  @Column()
  message: string;

  @ManyToOne(type => TelexConnection, x => x.id, { eager: true })
  from: TelexConnection;

  @ManyToOne(type => TelexConnection, x => x.id)
  to: TelexConnection;
}

export interface TelexMessageDTO {
  from: string;
  to: string;
  message: string;
}