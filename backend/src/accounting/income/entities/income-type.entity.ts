import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';

@Entity()
export class IncomeType {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToMany(() => Income, (income) => income.incomeType)
  incomes: Income[];

  @Column()
  name: string;

  @Column()
  description: string;
}
