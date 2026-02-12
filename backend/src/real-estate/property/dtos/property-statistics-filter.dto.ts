import { StatisticKey } from '@alisa-backend/common/types';
import { IsNumber, IsOptional } from 'class-validator';

export class PropertyStatisticsFilterDto {
  @IsNumber()
  @IsOptional()
  propertyId?: number;

  key?: StatisticKey;
  year?: number;
  month?: number;
  includeYearly?: boolean;
  includeMonthly?: boolean;
}
