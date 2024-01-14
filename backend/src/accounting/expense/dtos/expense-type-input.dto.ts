import { IsNotEmpty } from 'class-validator';

export class ExpenseTypeInputDto {
  @IsNotEmpty()
  name: string;

  description?: string;

  isTaxDeductible: boolean;
}
