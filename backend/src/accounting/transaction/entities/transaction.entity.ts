//TypeOrm entity for transaction table.
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { columnOptionTwoDecimal } from '@alisa-backend/common/typeorm.column.definitions';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ nullable: true })
  externalId?: string;

  @Column()
  sender: string;

  @Column()
  receiver: string;

  @Column()
  description: string;

  @Column({ type: 'timestamp' })
  transactionDate: Date;

  @Column({ type: 'timestamp' })
  accountingDate: Date;

  @Column(columnOptionTwoDecimal)
  public amount: number;

  @Column(columnOptionTwoDecimal)
  public quantity: number;

  @Column(columnOptionTwoDecimal)
  public totalAmount: number;

  @OneToOne(() => Expense, (expense) => expense.transaction, {
    eager: false,
    cascade: false,
    nullable: true,
  })
  expense?: Expense;

  @OneToOne(() => Income, (income) => income.transaction, {
    eager: false,
    cascade: false,
    nullable: true,
  })
  income?: Income;
}
