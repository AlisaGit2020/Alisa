import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { User } from '@asset-backend/people/user/entities/user.entity';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';

@Entity()
@Unique(['propertyId', 'userId'])
export class Ownership {
  @Column()
  share: number;

  //User
  @ManyToOne(() => User, (user) => user.ownerships, {
    eager: false,
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @PrimaryColumn()
  userId: number;

  //Property
  @ManyToOne(() => Property, (property) => property.ownerships, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @PrimaryColumn()
  propertyId: number;
}
