import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Expense } from '@asset-backend/accounting/expense/entities/expense.entity';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';
import { columnOptionTwoDecimal } from '@asset-backend/common/typeorm.column.definitions';
import { DepreciationRecord } from './depreciation-record.entity';

@Entity()
export class DepreciationAsset {
  @PrimaryGeneratedColumn()
  public id: number;

  // Link to the original expense (1:1)
  @OneToOne(() => Expense, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expenseId' })
  expense: Expense;

  @Column({ nullable: false })
  expenseId: number;

  // Property
  @ManyToOne(() => Property, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ nullable: false })
  propertyId: number;

  // Original purchase/improvement amount
  @Column(columnOptionTwoDecimal)
  originalAmount: number;

  // Year of acquisition
  @Column()
  acquisitionYear: number;

  // Month of acquisition (optional, for reference)
  @Column({ nullable: true })
  acquisitionMonth: number;

  // Remaining depreciation basis
  @Column(columnOptionTwoDecimal)
  remainingAmount: number;

  // Whether fully depreciated
  @Column({ default: false })
  isFullyDepreciated: boolean;

  // Description (copied from expense for display)
  @Column({ length: 255 })
  description: string;

  // Depreciation records for each year
  @OneToMany(() => DepreciationRecord, (record) => record.depreciationAsset)
  depreciationRecords: DepreciationRecord[];
}
