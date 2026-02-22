import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { ExpenseTypeKey } from '@alisa-backend/common/types';

@Entity()
export class ExpenseType {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true, type: 'varchar' })
  key: ExpenseTypeKey;

  //Expenses
  @OneToMany(() => Expense, (expense) => expense.expenseType)
  expenses: Expense[];

  @Column()
  isTaxDeductible: boolean;

  @Column({ default: false })
  isCapitalImprovement: boolean;
}
