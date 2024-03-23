import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';
import { columnOptionTwoDecimal } from '@alisa-backend/common/typeorm.column.definitions';

@Entity()
export class Expense {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ length: 255 })
  public description: string;

  @Column(columnOptionTwoDecimal)
  public amount: number;

  @Column(columnOptionTwoDecimal)
  public quantity: number;

  @Column(columnOptionTwoDecimal)
  public totalAmount: number;

  /*Expense type*/
  @ManyToOne(() => ExpenseType, (expenseType) => expenseType.expenses, {
    eager: false,
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'expenseTypeId' })
  expenseType: ExpenseType;

  @Column({ nullable: false })
  expenseTypeId: number;

  /*Property*/
  @ManyToOne(() => Property, (property) => property.expenses, {
    eager: false,
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ nullable: false })
  propertyId: number;

  /*Transaction*/
  @ManyToOne(() => Transaction, (transaction) => transaction.expenses, {
    eager: false,
    cascade: ['insert', 'update'],
    orphanedRowAction: 'delete',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @Column({ nullable: false })
  transactionId: number;
}
