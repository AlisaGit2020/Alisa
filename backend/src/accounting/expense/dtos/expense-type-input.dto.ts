import { IsNotEmpty } from 'class-validator';

export class ExpenseTypeInputDto {
  id?: number = 0;

  @IsNotEmpty()
  name: string;

  description?: string;

  isTaxDeductible: boolean;
}
