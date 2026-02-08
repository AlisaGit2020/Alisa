import { IsNumber, IsOptional, IsString } from 'class-validator';

export class DepreciationAssetInputDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  expenseId: number;

  @IsNumber()
  propertyId: number;

  @IsNumber()
  originalAmount: number;

  @IsNumber()
  acquisitionYear: number;

  @IsOptional()
  @IsNumber()
  acquisitionMonth?: number;

  @IsString()
  description: string;
}

export class DepreciationAssetDto {
  id: number;
  expenseId: number;
  propertyId: number;
  originalAmount: number;
  acquisitionYear: number;
  acquisitionMonth?: number;
  remainingAmount: number;
  isFullyDepreciated: boolean;
  description: string;
}
