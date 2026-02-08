export class DepreciationBreakdownItemDto {
  // Asset identification
  assetId: number;
  expenseId: number;
  propertyId: number;
  description: string;

  // Acquisition info
  acquisitionYear: number;
  acquisitionMonth?: number;

  // Amounts
  originalAmount: number;
  depreciationAmount: number;
  remainingAmount: number;

  // Status
  yearsRemaining: number;
  isFullyDepreciated: boolean;
}

export class DepreciationBreakdownDto {
  year: number;
  propertyId?: number;
  items: DepreciationBreakdownItemDto[];
  totalDepreciation: number;
}
