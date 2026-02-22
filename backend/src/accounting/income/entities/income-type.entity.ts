import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';

@Entity()
export class IncomeType {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true, nullable: true })
  key: string;

  @OneToMany(() => Income, (income) => income.incomeType)
  incomes: Income[];

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ default: false })
  isTaxable: boolean;
}
