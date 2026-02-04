export class TaxBreakdownItemDto {
  category: string;
  amount: number;
  isTaxDeductible: boolean;
  isCapitalImprovement?: boolean;
  depreciationAmount?: number;
}

export class TaxResponseDto {
  year: number;
  propertyId?: number;
  grossIncome: number;
  deductions: number;
  depreciation: number;
  netIncome: number;
  breakdown: TaxBreakdownItemDto[];
  calculatedAt?: Date;
}
