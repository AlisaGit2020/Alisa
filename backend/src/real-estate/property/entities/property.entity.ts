//TypeOrm entity for property table.

import { Expense } from 'src/accounting/expense/entities/expense.entity';
import { Column, ColumnOptions, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

const columnOptionTwoDecimal: ColumnOptions = {
  type: 'decimal',
  precision: 10,
  scale: 2,
  default: 0,
};

@Entity()
export class Property {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @OneToMany(() => Expense, (expense) => expense.property)
  expenses: Expense[]

}
