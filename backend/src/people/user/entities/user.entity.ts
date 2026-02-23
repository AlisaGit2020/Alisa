import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ownership } from '@asset-backend/people/ownership/entities/ownership.entity';
import type { DashboardConfig } from '@asset-backend/common/dashboard-config';
import { Tier } from '@asset-backend/admin/entities/tier.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id?: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  language?: string;

  @Column({ nullable: true })
  photo?: string;

  @ManyToOne(() => Tier, (tier) => tier.users, { eager: true, nullable: true })
  @JoinColumn({ name: 'tierId' })
  tier?: Tier;

  @Column({ nullable: true })
  tierId?: number;

  //Ownerships
  @OneToMany(() => Ownership, (ownership) => ownership.user, {
    nullable: true,
  })
  ownerships?: Ownership[];

  @Column({ type: 'jsonb', nullable: true })
  dashboardConfig?: DashboardConfig;

  @Column({ default: false })
  isAdmin: boolean;
}
