import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@alisa-backend/people/user/entities/user.entity';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';

@Entity()
export class Ownership {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  share: number;

  @ManyToOne(() => User, (user) => user.ownerships, {
    eager: false,
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: false })
  userId: number;

  @ManyToOne(() => Property, (property) => property.ownerships, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ nullable: false })
  propertyId: number;
}
