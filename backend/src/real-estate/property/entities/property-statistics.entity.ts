import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';

@Entity()
// Note: TypeORM's @Unique doesn't support NULLS NOT DISTINCT.
// After schema sync, run this SQL to fix the constraint:
// ALTER TABLE property_statistics DROP CONSTRAINT IF EXISTS "UQ_property_statistics_composite";
// ALTER TABLE property_statistics ADD CONSTRAINT "UQ_property_statistics_composite"
//   UNIQUE NULLS NOT DISTINCT ("propertyId", year, month, key);
@Unique('UQ_property_statistics_composite', ['propertyId', 'year', 'month', 'key'])
export class PropertyStatistics {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => Property, (property) => property.statistics, {
    onDelete: 'CASCADE',
  })
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
