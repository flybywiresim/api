import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class BlockedIp {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column()
    @Index()
    ip: string;

    @Column({ default: true })
    @Index()
    isActive?: boolean;

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    lastModifiedAt?: Date;

    @Column()
    reason: string;
}
