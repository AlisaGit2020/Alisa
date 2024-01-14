//TypeOrm entity for transaction table.
import { Expense } from 'src/accounting/expense/entities/expense.entity';
import { columnOptionTwoDecimal } from 'src/common/typeorm.column.definitions';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  description: string;

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column({ type: 'date' })
  accountingDate: Date;

  @Column(columnOptionTwoDecimal)
  public amount: number;

  @Column(columnOptionTwoDecimal)
  public quantity: number;

  @Column(columnOptionTwoDecimal)
  public totalAmount: number;

  @OneToOne(() => Expense, (expense) => expense.transaction, {
    eager: false,
    cascade: true,
    nullable: true,
  })
  expense: Expense;
}
