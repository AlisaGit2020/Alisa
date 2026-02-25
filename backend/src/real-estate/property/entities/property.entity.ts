//TypeOrm entity for property table.

import { Income } from '@asset-backend/accounting/income/entities/income.entity';
import { Expense } from '@asset-backend/accounting/expense/entities/expense.entity';
import { columnOptionOneDecimal } from '@asset-backend/common/typeorm.column.definitions';
import { DecimalToNumberTransformer } from '@asset-backend/common/transformer/entity.data.transformer';
import {
  PropertyExternalSource,
  PropertyStatus,
} from '@asset-backend/common/types';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ownership } from '@asset-backend/people/ownership/entities/ownership.entity';
import { Transaction } from '@asset-backend/accounting/transaction/entities/transaction.entity';
import { PropertyStatistics } from '@asset-backend/real-estate/property/entities/property-statistics.entity';
import { Address } from '@asset-backend/real-estate/address/entities/address.entity';

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

  @OneToOne(() => Address, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
    nullable: true,
  })
  @JoinColumn({ name: 'addressId' })
  public address?: Address;

  @Column({ nullable: true })
  public addressId?: number;

  @Column({ nullable: true })
  public buildYear?: number;

  @Column({ nullable: true })
  public apartmentType?: string;

  @Column({ type: 'int', default: PropertyStatus.OWN })
  public status: PropertyStatus = PropertyStatus.OWN;

  @Column({ type: 'int', nullable: true })
  public externalSource?: PropertyExternalSource;

  @Column({ nullable: true })
  public externalSourceId?: string;

  @Column({ nullable: true })
  public rooms?: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: new DecimalToNumberTransformer(),
  })
  public purchasePrice?: number;

  @Column({ type: 'date', nullable: true })
  public purchaseDate?: Date;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: new DecimalToNumberTransformer(),
  })
  public purchaseLoan?: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: new DecimalToNumberTransformer(),
  })
  public salePrice?: number;

  @Column({ type: 'date', nullable: true })
  public saleDate?: Date;
}
