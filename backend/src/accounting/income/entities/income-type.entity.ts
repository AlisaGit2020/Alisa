import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Income } from '@asset-backend/accounting/income/entities/income.entity';
import { IncomeTypeKey } from '@asset-backend/common/types';

@Entity()
export class IncomeType {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true, type: 'varchar' })
  key: IncomeTypeKey;

  @OneToMany(() => Income, (income) => income.incomeType)
  incomes: Income[];

  @Column({ default: false })
  isTaxable: boolean;
}
