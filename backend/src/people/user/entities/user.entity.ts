import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ownership } from '@alisa-backend/people/ownership/entities/ownership.entity';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';
import type { DashboardConfig } from '@alisa-backend/common/dashboard-config';
import { Tier } from '@alisa-backend/admin/entities/tier.entity';

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

  @ManyToOne(() => Tier, (tier) => tier.users, { eager: true, nullable: true })
  @JoinColumn({ name: 'tierId' })
  tier?: Tier;

  @Column({ nullable: true })
  tierId?: number;

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

  @Column({ type: 'jsonb', nullable: true })
  dashboardConfig?: DashboardConfig;

  @Column({ default: false })
  isAdmin: boolean;
}
