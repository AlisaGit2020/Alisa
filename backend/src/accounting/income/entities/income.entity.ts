import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';

@Entity()
export class Income {
  @PrimaryGeneratedColumn()
  public id: number;

  /*Income type*/
  @ManyToOne(() => IncomeType, (incomeType) => incomeType.incomes, {
    eager: false,
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'incomeTypeId' })
  incomeType: IncomeType;

  @Column({ nullable: false })
  incomeTypeId: number;

  /*Property*/
  @ManyToOne(() => Property, (property) => property.incomes, {
    eager: false,
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ nullable: false })
  propertyId: number;

  /*Transaction*/
  @OneToOne(() => Transaction, {
    eager: false,
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @Column({ nullable: false })
  transactionId: number;
}
