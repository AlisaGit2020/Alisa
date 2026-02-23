import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';
import { ExpenseType } from '@asset-backend/accounting/expense/entities/expense-type.entity';
import { IncomeType } from '@asset-backend/accounting/income/entities/income-type.entity';
import {
  AllocationCondition,
  TransactionType,
} from '@asset-backend/common/types';

@Entity()
export class AllocationRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column()
  propertyId: number;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ default: 0 })
  priority: number;

  @Column({ type: 'smallint' })
  transactionType: TransactionType;

  @Column({ nullable: true })
  expenseTypeId: number | null;

  @ManyToOne(() => ExpenseType, { nullable: true })
  @JoinColumn({ name: 'expenseTypeId' })
  expenseType: ExpenseType | null;

  @Column({ nullable: true })
  incomeTypeId: number | null;

  @ManyToOne(() => IncomeType, { nullable: true })
  @JoinColumn({ name: 'incomeTypeId' })
  incomeType: IncomeType | null;

  @Column({ type: 'jsonb' })
  conditions: AllocationCondition[];

  @Column({ default: true })
  isActive: boolean;
}
