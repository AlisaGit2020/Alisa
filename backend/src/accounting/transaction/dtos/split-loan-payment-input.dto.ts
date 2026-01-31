import { IsNumber, IsOptional } from 'class-validator';

export class SplitLoanPaymentInputDto {
  @IsNumber()
  principalExpenseTypeId: number;

  @IsNumber()
  interestExpenseTypeId: number;

  @IsOptional()
  @IsNumber()
  handlingFeeExpenseTypeId?: number;
}
