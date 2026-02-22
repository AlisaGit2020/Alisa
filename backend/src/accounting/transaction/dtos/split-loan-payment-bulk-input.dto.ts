import { IsArray } from 'class-validator';

export class SplitLoanPaymentBulkInputDto {
  @IsArray()
  ids: number[];
}
