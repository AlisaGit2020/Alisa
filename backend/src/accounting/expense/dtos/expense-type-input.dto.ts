import { IsNotEmpty } from "class-validator";
import { TransactionInputDto } from "src/accounting/transaction/dtos/transaction-input.dto";

export class ExpenseTypeInputDto {
  @IsNotEmpty()
  name: string;

  description?: string;

  isTaxDeductible: boolean;
}
