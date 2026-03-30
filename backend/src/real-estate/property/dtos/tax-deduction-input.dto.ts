import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { TaxDeductionMetadata, TaxDeductionType } from '@asset-backend/common/types';

export class TaxDeductionInputDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNotEmpty()
  @IsNumber()
  propertyId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(2020)
  @Max(2100)
  year: number;

  @IsEnum(TaxDeductionType)
  deductionType: TaxDeductionType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  metadata?: TaxDeductionMetadata;
}
