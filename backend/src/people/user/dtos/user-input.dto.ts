import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import type { DashboardConfig } from '@alisa-backend/common/dashboard-config';

export class UserInputDto {
  id?: number;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  language?: string;

  photo?: string;

  @IsOptional()
  dashboardConfig?: DashboardConfig;
}
