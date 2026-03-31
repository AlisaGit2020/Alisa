import { IsEnum, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ChargeType } from '@asset-backend/common/types';

export class PropertyChargeInputDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsNumber()
  propertyId?: number;

  @IsEnum(ChargeType)
  chargeType: ChargeType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}

export class PropertyChargeUpdateDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}
