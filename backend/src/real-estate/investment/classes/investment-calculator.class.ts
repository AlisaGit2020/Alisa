//This class calculates an apartment key figures by given parameters
import { pmt } from 'financial';
import { InvestmentInputDto } from '../dtos/investment-input.dto';

export class InvestmentCalculator {
  /**
   * Dept free price when buying
   */
  public readonly deptFreePrice: number = 0;

  /**
   * Dept share when buying
   */
  public readonly deptShare: number = 0;

  /**
   * Transfer tax in percent when buying
   */
  public readonly transferTaxPercent: number;

  /**
   * Maintenance fee per month
   */
  public readonly maintenanceFee: number;

  /**
   * Charge for financial costs per month
   */
  public readonly chargeForFinancialCosts: number;

  /**
   * Rent per month
   */
  public readonly rentPerMonth: number;

  /**
   * Apartment size in square meters
   */
  public readonly apartmentSize: number;

  /**
   * Water charge per month
   */
  public readonly waterCharge: number;

  /**
   * Own contribution
   */
  public readonly downPayment: number;

  /**
   * Loan interest in percent
   */
  public readonly loanInterestPercent: number;

  /**
   * Loan period in years
   */
  public readonly loanPeriod: number;

  /**
   * Selling price after dept share
   */
  public readonly sellingPrice: number;

  /**
   * Transfer tax to pay when buying
   */
  public readonly transferTax: number;

  /**
   * Maintenance total costs per month
   */
  public readonly maintenanceCosts: number;

  /**
   * Rental income per year
   */
  public readonly rentalYieldPercent: number;

  /**
   * Rental income per year
   */
  public readonly rentalIncomePerYear: number;

  /**
   * Price per square meter
   */
  public readonly pricePerSquareMeter: number;

  /**
   * Bank loan financing. Includes transfer tax.
   */
  public readonly loanFinancing: number;

  /**
   * Bank loan first month installment
   */
  public readonly loanFirstMonthInterest: number;

  /**
   * Bank loan first month installment
   */
  public readonly loanFirstMonthInstallment: number;

  /**
   * Tax deductible expenses per year
   */
  public readonly taxDeductibleExpensesPerYear: number;

  /**
   * Profit per year
   */
  public readonly profitPerYear: number;

  /**
   * Tax per year
   */
  public readonly taxPerYear: number;

  /**
   * Expenses per month
   */
  public readonly expensesPerMonth: number;

  /**
   * Cash flow per month
   */
  public readonly cashFlowPerMonth: number;

  /**
   * Cash flow after tax per month
   */
  public readonly cashFlowAfterTaxPerMonth: number;

  constructor(investment: InvestmentInputDto) {
    this.deptFreePrice = investment.deptFreePrice;
    this.deptShare = investment.deptShare;
    this.transferTaxPercent = investment.transferTaxPercent;
    this.maintenanceFee = investment.maintenanceFee;
    this.chargeForFinancialCosts = investment.chargeForFinancialCosts;
    this.rentPerMonth = investment.rentPerMonth;
    this.apartmentSize = investment.apartmentSize || 0;
    this.waterCharge = investment.waterCharge || 0;
    this.downPayment = investment.downPayment || 0;
    this.loanInterestPercent = investment.loanInterestPercent || 0;
    this.loanPeriod = investment.loanPeriod || 0;

    this.sellingPrice = this.getSellingPrice();
    this.transferTax = this.getTransferTax();
    this.maintenanceCosts = this.getMaintenanceCosts();
    this.rentalYieldPercent = this.getRentalYieldPercent();
    this.rentalIncomePerYear = this.getRentalIncomePerYear();
    this.pricePerSquareMeter = this.getPricePerSquareMeter();
    this.loanFinancing = this.getLoanFinancing();
    this.loanFirstMonthInterest = this.getLoanFirstMonthInterest();
    this.loanFirstMonthInstallment = this.getLoanFirstMonthInstallment();
    this.taxDeductibleExpensesPerYear = this.getTaxDeductibleExpensesPerYear();
    this.profitPerYear = this.getProfitPerYear();
    this.taxPerYear = this.getTaxPerYear();
    this.expensesPerMonth = this.getExpensesPerMonth();
    this.cashFlowPerMonth = this.getCashFlowPerMonth();
    this.cashFlowAfterTaxPerMonth = this.getCashFlowAfterTaxPerMonth();
  }

  private getSellingPrice(): number {
    return this.roundToTwo(this.deptFreePrice - this.deptShare);
  }

  private getTransferTax(): number {
    return this.roundToTwo(
      (this.deptFreePrice * this.transferTaxPercent) / 100,
    );
  }

  private getMaintenanceCosts(): number {
    return this.roundToTwo(this.maintenanceFee + this.chargeForFinancialCosts);
  }

  private getRentalYieldPercent(): number {
    const rentalYield =
      (((this.rentPerMonth - this.maintenanceFee) * 12) /
        (this.deptFreePrice + this.transferTax)) *
      100;
    return this.roundToTwo(rentalYield);
  }

  private getRentalIncomePerYear(): number {
    return this.roundToTwo(this.rentPerMonth * 12);
  }

  private getPricePerSquareMeter(): number {
    return this.roundToTwo(this.deptFreePrice / this.apartmentSize);
  }

  private getLoanFinancing(): number {
    return this.roundToTwo(
      this.sellingPrice + this.transferTax - this.downPayment,
    );
  }

  private getLoanFirstMonthInterest(): number {
    const interest = (this.loanInterestPercent / 12 / 100) * this.loanFinancing;
    return this.roundToTwo(interest);
  }

  private getLoanFirstMonthInstallment(): number {
    const installment = pmt(
      this.loanInterestPercent / 100 / 12,
      12 * this.loanPeriod,
      this.loanFinancing,
    );
    return this.roundToTwo(installment * -1);
  }

  private getTaxDeductibleExpensesPerYear(): number {
    return this.roundToTwo(
      this.maintenanceCosts * 12 + this.loanFirstMonthInterest * 12,
    );
  }

  private getProfitPerYear(): number {
    return this.roundToTwo(
      this.rentalIncomePerYear - this.taxDeductibleExpensesPerYear,
    );
  }

  private getTaxPerYear(): number {
    let taxPercent = 0.3;
    if (this.profitPerYear > 30000) {
      taxPercent = 0.34;
    }
    return this.roundToTwo(this.profitPerYear * taxPercent);
  }

  private getExpensesPerMonth(): number {
    return this.roundToTwo(
      this.maintenanceCosts + this.loanFirstMonthInstallment,
    );
  }

  private getCashFlowPerMonth(): number {
    return this.roundToTwo(this.rentPerMonth - this.expensesPerMonth);
  }

  private getCashFlowAfterTaxPerMonth(): number {
    return this.roundToTwo(this.cashFlowPerMonth - this.taxPerYear / 12);
  }

  private roundToTwo(num: number): number {
    return Math.round(num * 100) / 100;
  }
}
