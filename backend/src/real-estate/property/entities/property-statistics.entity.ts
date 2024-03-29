import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';

@Entity()
export class PropertyStatistics {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => Property, (property) => property.statistics, {})
  @JoinColumn({ name: 'propertyId' })
  property: Property;
  @Column({ nullable: false })
  propertyId: number;

  @Column({ length: 50 })
  @Index()
  key: string;

  @Column({ type: 'smallint', nullable: true })
  year: number;

  @Column({ type: 'smallint', nullable: true })
  month: number;

  @Column()
  public value: string;
}
