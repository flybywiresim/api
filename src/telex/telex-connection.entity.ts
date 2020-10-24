import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class TelexConnection {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ default: true })
  isActive?: boolean;

  @CreateDateColumn()
  firstContact?: Date;

  // TODO: Does not work?!
  @UpdateDateColumn()
  lastContact?: Date;

  @Column()
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
  location: Point;

  @Column()
  ip: string;
}

export interface Point {
  x: number,
  y: number
}

export interface TelexConnectionDTO {
  flight: string;
  location: Point;
}