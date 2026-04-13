import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '@asset-backend/people/user/entities/user.entity';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';

@Entity()
export class PropertyCleaner {
  @ManyToOne(() => Property, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @PrimaryColumn()
  propertyId: number;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @PrimaryColumn()
  userId: number;
}
