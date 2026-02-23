import { Investment } from '@asset-backend/real-estate/investment/entities/investment.entity';

export interface CreateInvestmentOptions {
  id?: number;
  userId?: number;
  propertyId?: number;
  name?: string;
  deptFreePrice?: number;
  deptShare?: number;
  transferTaxPercent?: number;
  maintenanceFee?: number;
  chargeForFinancialCosts?: number;
  rentPerMonth?: number;
  apartmentSize?: number;
  waterCharge?: number;
  downPayment?: number;
  loanInterestPercent?: number;
  loanPeriod?: number;
}

export const createInvestment = (
  options: CreateInvestmentOptions = {},
): Investment => {
  const investment = new Investment();
  investment.id = options.id ?? 1;
  investment.userId = options.userId ?? 1;
  investment.propertyId = options.propertyId;
  investment.name = options.name ?? 'Test Investment';
  investment.deptFreePrice = options.deptFreePrice ?? 100000;
  investment.deptShare = options.deptShare ?? 50000;
  investment.transferTaxPercent = options.transferTaxPercent ?? 2;
  investment.maintenanceFee = options.maintenanceFee ?? 200;
  investment.chargeForFinancialCosts = options.chargeForFinancialCosts ?? 50;
  investment.rentPerMonth = options.rentPerMonth ?? 800;
  investment.apartmentSize = options.apartmentSize ?? 50;
  investment.waterCharge = options.waterCharge ?? 20;
  investment.downPayment = options.downPayment ?? 20000;
  investment.loanInterestPercent = options.loanInterestPercent ?? 3.5;
  investment.loanPeriod = options.loanPeriod ?? 25;

  // Calculated fields
  investment.sellingPrice = 150000;
  investment.transferTax = 3000;
  investment.maintenanceCosts = 2400;
  investment.rentalYieldPercent = 6.4;
  investment.rentalIncomePerYear = 9600;
  investment.pricePerSquareMeter = 3000;
  investment.loanFinancing = 130000;
  investment.loanFirstMonthInterest = 379.17;
  investment.loanFirstMonthInstallment = 754.23;
  investment.taxDeductibleExpensesPerYear = 5000;
  investment.profitPerYear = 3000;
  investment.taxPerYear = 900;
  investment.expensesPerMonth = 500;
  investment.cashFlowPerMonth = 300;
  investment.cashFlowAfterTaxPerMonth = 225;

  return investment;
};
