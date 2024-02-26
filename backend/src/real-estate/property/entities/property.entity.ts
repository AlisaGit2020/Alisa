//TypeOrm entity for property table.

import { Income } from '@alisa-backend/accounting/income/entities/income.entity';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { columnOptionOneDecimal } from '@alisa-backend/common/typeorm.column.definitions';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Property {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @Column(columnOptionOneDecimal)
  public size: number;

  @OneToMany(() => Expense, (expense) => expense.property)
  expenses: Expense[];

  @OneToMany(() => Income, (income) => income.property)
  incomes: Income[];
}
