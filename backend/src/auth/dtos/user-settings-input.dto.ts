import {
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
  IsBoolean,
  IsIn,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { WidgetSize } from '@alisa-backend/common/dashboard-config';
import { SUPPORTED_LANGUAGES } from '@alisa-backend/common/types';

class WidgetConfigDto {
  @IsString()
  id: string;

  @IsBoolean()
  visible: boolean;

  @IsNumber()
  order: number;

  @IsOptional()
  @IsIn(['1/1', '1/2', '1/3', '1/4'])
  size?: WidgetSize;
}

class DashboardConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetConfigDto)
  widgets: WidgetConfigDto[];
}

export class UserSettingsInputDto {
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_LANGUAGES)
  language?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DashboardConfigDto)
  dashboardConfig?: DashboardConfigDto;
}
