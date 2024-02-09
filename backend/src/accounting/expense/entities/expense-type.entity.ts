import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';

@Entity()
export class ExpenseType {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToMany(() => Expense, (expense) => expense.expenseType)
  expenses: Expense[];

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  isTaxDeductible: boolean;
}
