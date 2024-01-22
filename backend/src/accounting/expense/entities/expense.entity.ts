import { Transaction } from 'src/accounting/transaction/entities/transaction.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExpenseType } from './expense-type.entity';
import { Property } from 'src/real-estate/property/entities/property.entity';

@Entity()
export class Expense {
  @PrimaryGeneratedColumn()
  public id: number;

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
  @OneToOne(() => Transaction, {
    eager: false,
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @Column({ nullable: false })
  transactionId: number;
}
