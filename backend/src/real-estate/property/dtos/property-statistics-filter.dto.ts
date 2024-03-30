import { StatisticKey } from '@alisa-backend/common/types';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class PropertyStatisticsFilterDto {
  @IsNumber()
  @IsNotEmpty()
  propertyId: number;

  key?: StatisticKey;
  year?: number;
  month?: number;
}
