import { IsEmail, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
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
  @IsNumber()
  loanPrincipalExpenseTypeId?: number;

  @IsOptional()
  @IsNumber()
  loanInterestExpenseTypeId?: number;

  @IsOptional()
  @IsNumber()
  loanHandlingFeeExpenseTypeId?: number;

  @IsOptional()
  dashboardConfig?: DashboardConfig;
}
