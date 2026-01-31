import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class SplitLoanPaymentBulkInputDto {
  @IsArray()
  ids: number[];

  @IsNumber()
  principalExpenseTypeId: number;

  @IsNumber()
  interestExpenseTypeId: number;

  @IsOptional()
  @IsNumber()
  handlingFeeExpenseTypeId?: number;
}
