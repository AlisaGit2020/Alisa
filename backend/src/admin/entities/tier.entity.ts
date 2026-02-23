import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@asset-backend/people/user/entities/user.entity';

@Entity()
export class Tier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  maxProperties: number;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: false })
  isDefault: boolean;

  @OneToMany(() => User, (user) => user.tier, { nullable: true })
  users?: User[];
}
