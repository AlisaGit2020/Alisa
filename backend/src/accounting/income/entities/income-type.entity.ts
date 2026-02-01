import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';
import { User } from '@alisa-backend/people/user/entities/user.entity';

@Entity()
export class IncomeType {
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

  @OneToMany(() => Income, (income) => income.incomeType)
  incomes: Income[];

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ default: false })
  isTaxable: boolean;
}
