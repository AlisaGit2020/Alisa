import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';
import { columnOptionTwoDecimal } from '@alisa-backend/common/typeorm.column.definitions';

@Entity()
export class PropertyStatistics {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => Property, (property) => property.statistics, {})
  @JoinColumn({ name: 'propertyId' })
  property: Property;
  @Column({ nullable: false })
  propertyId: number;

  @Column(columnOptionTwoDecimal)
  public balance: number;
}
