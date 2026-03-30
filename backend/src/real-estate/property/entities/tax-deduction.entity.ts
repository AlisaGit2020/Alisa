import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from './property.entity';
import { TaxDeductionMetadata, TaxDeductionType } from '@asset-backend/common/types';
import { DecimalToNumberTransformer } from '@asset-backend/common/transformer/entity.data.transformer';

@Entity('tax_deduction')
export class TaxDeduction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  propertyId: number;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ type: 'smallint' })
  year: number;

  @Column({ type: 'smallint' })
  deductionType: TaxDeductionType;

  @Column({ length: 255, nullable: true })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new DecimalToNumberTransformer(),
  })
  amount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: TaxDeductionMetadata | null;
}
