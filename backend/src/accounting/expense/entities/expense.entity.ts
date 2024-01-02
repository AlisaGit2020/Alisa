
import { Transaction } from 'src/accounting/transaction/entities/transaction.entity';
import { Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ExpenseType } from './expense-type.entity';
import { Property } from 'src/real-estate/property/entities/property.entity';


@Entity()
export class Expense {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => ExpenseType, { eager: true, cascade: ["insert", "update"] })
  @JoinColumn({ name: 'expense_type_id' })
  expenseType: ExpenseType;

  @OneToOne(() => Property, { eager: true, cascade: ["insert", "update"] })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @OneToOne(() => Transaction, { eager: true, cascade: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

}
