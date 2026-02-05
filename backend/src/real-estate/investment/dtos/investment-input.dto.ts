export class InvestmentInputDto {
  deptFreePrice: number;
  deptShare: number;
  transferTaxPercent: number = 2; //default 2%
  maintenanceFee: number;
  chargeForFinancialCosts: number;
  rentPerMonth: number;
  apartmentSize?: number;
  waterCharge?: number;
  downPayment?: number;
  loanInterestPercent?: number;
  loanPeriod?: number; //in years
  propertyId?: number;
  name?: string;
}
