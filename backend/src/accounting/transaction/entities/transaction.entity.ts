//TypeOrm entity for transaction table.
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { columnOptionTwoDecimal } from '@alisa-backend/common/typeorm.column.definitions';
import {Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Property} from "@alisa-backend/real-estate/property/entities/property.entity";

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ nullable: true })
  externalId?: string;

  @Column()
  sender: string;

  @Column()
  receiver: string;

  @Column()
  description: string;

  @Column({ type: 'timestamp' })
  transactionDate: Date;

  @Column({ type: 'timestamp' })
  accountingDate: Date;

  @Column(columnOptionTwoDecimal)
  public amount: number;

  /*Property*/
  @ManyToOne(() => Property, (property) => property.transactions, {
    eager: false,
    cascade: false,
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;
  @Column({ nullable: false })
  propertyId: number;

  /*Expense*/
  @OneToMany(() => Expense, (expense) => expense.transaction, {
    eager: false,
    cascade: ["insert", "update", "remove"],
    nullable: true,
  })
  expenses?: Expense[];

  /*Income*/
  @OneToMany(() => Income, (income) => income.transaction, {
    eager: false,
    cascade: ["insert", "update", "remove"],
    nullable: true,
  })
  incomes?: Income[];
}
