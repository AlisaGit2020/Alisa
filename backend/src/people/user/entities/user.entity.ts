import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Ownership } from '@alisa-backend/people/ownership/entities/ownership.entity';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id?: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  language?: string;

  @Column({ nullable: true })
  photo?: string;

  //Ownerships
  @OneToMany(() => Ownership, (ownership) => ownership.user, {
    nullable: true,
  })
  ownerships?: Ownership[];

  //ExpenseTypes
  @OneToMany(() => ExpenseType, (expenseType) => expenseType.user, {
    nullable: true,
    eager: false,
  })
  expenseTypes?: ExpenseType[];

  //IncomeTypes
  @OneToMany(() => IncomeType, (incomeType) => incomeType.user, {
    nullable: true,
    eager: false,
  })
  incomeTypes?: IncomeType[];

  // Loan payment expense type defaults
  @Column({ nullable: true })
  loanPrincipalExpenseTypeId?: number;

  @Column({ nullable: true })
  loanInterestExpenseTypeId?: number;

  @Column({ nullable: true })
  loanHandlingFeeExpenseTypeId?: number;
}
