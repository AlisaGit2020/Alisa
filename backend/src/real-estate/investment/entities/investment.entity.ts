//TypeOrm entity for investment table. Fields are same as in investment-calculator.class.ts

import { columnOptionTwoDecimal } from 'src/common/typeorm.column.definitions';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@asset-backend/people/user/entities/user.entity';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';

@Entity()
export class Investment {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Property, { nullable: true, onDelete: 'CASCADE' })
  property?: Property;

  @Column({ nullable: true })
  propertyId?: number;

  @Column({ nullable: true })
  name?: string;

  @Column(columnOptionTwoDecimal)
  public deptFreePrice: number;

  @Column(columnOptionTwoDecimal)
  public deptShare: number;

  @Column(columnOptionTwoDecimal)
  public transferTaxPercent: number;

  @Column(columnOptionTwoDecimal)
  public maintenanceFee: number;

  @Column(columnOptionTwoDecimal)
  public chargeForFinancialCosts: number;

  @Column(columnOptionTwoDecimal)
  public rentPerMonth: number;

  @Column({ ...columnOptionTwoDecimal, nullable: true })
  public apartmentSize?: number;

  @Column({ ...columnOptionTwoDecimal, nullable: true })
  public waterCharge?: number;

  @Column({ ...columnOptionTwoDecimal, nullable: true })
  public downPayment?: number;

  @Column({ ...columnOptionTwoDecimal, nullable: true })
  public loanInterestPercent?: number;

  @Column({ nullable: true })
  public loanPeriod?: number;

  @Column(columnOptionTwoDecimal)
  public sellingPrice: number;

  @Column(columnOptionTwoDecimal)
  public transferTax: number;

  @Column(columnOptionTwoDecimal)
  public maintenanceCosts: number;

  @Column(columnOptionTwoDecimal)
  public rentalYieldPercent: number;

  @Column(columnOptionTwoDecimal)
  public rentalIncomePerYear: number;

  @Column(columnOptionTwoDecimal)
  public pricePerSquareMeter: number;

  @Column(columnOptionTwoDecimal)
  public loanFinancing: number;

  @Column(columnOptionTwoDecimal)
  public loanFirstMonthInterest: number;

  @Column(columnOptionTwoDecimal)
  public loanFirstMonthInstallment: number;

  @Column(columnOptionTwoDecimal)
  public taxDeductibleExpensesPerYear: number;

  @Column(columnOptionTwoDecimal)
  public profitPerYear: number;

  @Column(columnOptionTwoDecimal)
  public taxPerYear: number;

  @Column(columnOptionTwoDecimal)
  public expensesPerMonth: number;

  @Column(columnOptionTwoDecimal)
  public cashFlowPerMonth: number;

  @Column(columnOptionTwoDecimal)
  public cashFlowAfterTaxPerMonth: number;
}
