import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@asset-backend/people/user/entities/user.entity';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';

@Entity()
export class Cleaning {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @ManyToOne(() => Property, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  propertyId: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'int' })
  percentage: number;
}
