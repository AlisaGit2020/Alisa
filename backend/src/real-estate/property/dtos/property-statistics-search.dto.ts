import { StatisticKey } from '@asset-backend/common/types';

export class PropertyStatisticsSearchDto {
  propertyId?: number;
  key?: StatisticKey;
  year?: number;
  month?: number;
  includeMonthly?: boolean;
  includeYearly?: boolean;
}
