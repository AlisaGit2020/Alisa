//TypeOrm entity for investment table. Fields are same as in investment-calculator.class.ts

import { Column, ColumnOptions, Entity, PrimaryGeneratedColumn } from 'typeorm';

const columnOptionTwoDecimal: ColumnOptions = {
  type: 'decimal',
  precision: 10,
  scale: 2,
  default: 0,
};

@Entity()
export class Investment {
  @PrimaryGeneratedColumn()
  public id: number;

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

  @Column(columnOptionTwoDecimal)
  public apartmentSize: number;

  @Column(columnOptionTwoDecimal)
  public waterCharge: number;

  @Column(columnOptionTwoDecimal)
  public downPayment: number;

  @Column(columnOptionTwoDecimal)
  public loanInterestPercent: number;

  @Column()
  public loanPeriod: number;

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
