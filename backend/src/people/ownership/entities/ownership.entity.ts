import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';

@Entity()
export class Ownership {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  share: number;

  @ManyToOne(() => User, (owner) => owner.ownerships, {
    eager: false,
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'userId' })
  owner: User;

  @ManyToOne(() => Property, (property) => property.ownerships, {
    eager: false,
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;
}
