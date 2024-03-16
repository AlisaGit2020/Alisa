import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { User } from '@alisa-backend/people/user/entities/user.entity';

@Entity()
export class ExpenseType {
  @PrimaryGeneratedColumn()
  public id: number;

  //User
  @ManyToOne(() => User, (user) => user.expenseTypes, {
    eager: false,
    cascade: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: false })
  userId: number;

  //Expenses
  @OneToMany(() => Expense, (expense) => expense.expenseType)
  expenses: Expense[];

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  isTaxDeductible: boolean;
}
