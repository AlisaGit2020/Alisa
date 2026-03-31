import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from './property.entity';
import { ChargeType } from '@asset-backend/common/types';
import { DecimalToNumberTransformer } from '@asset-backend/common/transformer/entity.data.transformer';

@Entity('property_charge')
export class PropertyCharge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  propertyId: number;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ type: 'smallint' })
  chargeType: ChargeType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new DecimalToNumberTransformer(),
  })
  amount: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null;
}
