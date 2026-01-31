import { IsNumber, IsOptional } from 'class-validator';

export class UserSettingsInputDto {
  @IsOptional()
  @IsNumber()
  loanPrincipalExpenseTypeId?: number;

  @IsOptional()
  @IsNumber()
  loanInterestExpenseTypeId?: number;

  @IsOptional()
  @IsNumber()
  loanHandlingFeeExpenseTypeId?: number;
}
