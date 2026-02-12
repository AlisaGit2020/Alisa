import { StatisticKey } from '@alisa-backend/common/types';
import { IsNumber, IsOptional } from 'class-validator';

export class PropertyStatisticsFilterDto {
  // @IsNumber() validates only when value is present (not undefined/null)
  // due to @IsOptional() decorator - optional but must be number if provided
  @IsNumber()
  @IsOptional()
  propertyId?: number;

  key?: StatisticKey;
  year?: number;
  month?: number;
  includeYearly?: boolean;
  includeMonthly?: boolean;
}
