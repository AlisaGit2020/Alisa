
import { Transaction } from 'src/accounting/transaction/entities/transaction.entity';
import { Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ExpenseType } from './expense-type.entity';
import { Property } from 'src/real-estate/property/entities/property.entity';


@Entity()
export class Expense {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => ExpenseType, (expenseType) => expenseType.expenses, {
    eager: true, cascade: ["insert", "update"]
  })
  @JoinColumn({ name: 'expense_type_id' })
  expenseType: ExpenseType;

  @ManyToOne(() => Property, (property) => property.expenses, {
    eager: true, cascade: ["insert", "update"]
  })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @OneToOne(() => Transaction, {
    eager: true, cascade: true
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

}

