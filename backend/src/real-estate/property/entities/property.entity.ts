//TypeOrm entity for property table.

import { Income } from '@alisa-backend/accounting/income/entities/income.entity';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { columnOptionOneDecimal } from '@alisa-backend/common/typeorm.column.definitions';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Ownership } from '@alisa-backend/people/ownership/entities/ownership.entity';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { PropertyStatistics } from '@alisa-backend/real-estate/property/entities/property-statistics.entity';

@Entity()
export class Property {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @Column(columnOptionOneDecimal)
  public size: number;

  @OneToMany(() => Transaction, (transaction) => transaction.property, {
    eager: false,
  })
  transactions: Transaction[];

  @OneToMany(() => Expense, (expense) => expense.property, {
    eager: false,
  })
  expenses: Expense[];

  @OneToMany(() => Income, (income) => income.property, {
    eager: false,
  })
  incomes: Income[];

  @OneToMany(() => Ownership, (ownership) => ownership.property, {
    cascade: ['insert', 'update', 'remove'],
  })
  ownerships: Ownership[];

  @OneToMany(() => PropertyStatistics, (statistics) => statistics.property, {
    eager: false,
  })
  statistics: PropertyStatistics[];

  @Column({ nullable: true })
  public photo?: string;

  @Column({ nullable: true, type: 'text' })
  public description?: string;
}
