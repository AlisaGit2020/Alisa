//TypeOrm entity for property table.

import { Expense } from 'src/accounting/expense/entities/expense.entity';
import { columnOptionOneDecimal } from 'src/common/typeorm.column.definitions';
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
}
