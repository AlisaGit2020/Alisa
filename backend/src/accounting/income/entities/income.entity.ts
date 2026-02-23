import { Transaction } from '@asset-backend/accounting/transaction/entities/transaction.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IncomeType } from '@asset-backend/accounting/income/entities/income-type.entity';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';
import { columnOptionTwoDecimal } from '@asset-backend/common/typeorm.column.definitions';

@Entity()
export class Income {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ length: 255 })
  public description: string;

  @Column(columnOptionTwoDecimal)
  public amount: number;

  @Column(columnOptionTwoDecimal)
  public quantity: number;

  @Column(columnOptionTwoDecimal)
  public totalAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  public accountingDate: Date;

  /*Income type*/
  @ManyToOne(() => IncomeType, (incomeType) => incomeType.incomes, {
    eager: false,
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'incomeTypeId' })
  incomeType: IncomeType;

  @Column({ nullable: false })
  incomeTypeId: number;

  /*Property*/
  @ManyToOne(() => Property, (property) => property.incomes, {
    eager: false,
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ nullable: false })
  propertyId: number;

  /*Transaction*/
  @ManyToOne(() => Transaction, (transaction) => transaction.incomes, {
    eager: false,
    cascade: ['insert', 'update'],
    orphanedRowAction: 'delete',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @Column({ nullable: true })
  transactionId: number | null;
}
