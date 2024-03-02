//TypeOrm entity for property table.

import { Income } from '@alisa-backend/accounting/income/entities/income.entity';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { columnOptionOneDecimal } from '@alisa-backend/common/typeorm.column.definitions';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Ownership } from '@alisa-backend/people/ownership/entities/ownership.entity';

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

  @OneToMany(() => Ownership, (ownership) => ownership.property, {
    cascade: ['insert', 'update', 'remove'],
  })
  ownerships: Ownership[];
}
