
import { Transaction } from 'src/accounting/transaction/entities/transaction.entity';
import { Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ExpenseType } from './expense-type.entity';


@Entity()
export class Expense {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => ExpenseType, { eager: true, cascade: true })
  @JoinColumn({ name: 'expense_type_id' })
  expenseType: ExpenseType;

  @OneToOne(() => Transaction, { eager: true, cascade: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

}
