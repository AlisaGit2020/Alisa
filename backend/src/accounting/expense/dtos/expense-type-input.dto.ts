import { TransactionInputDto } from "src/accounting/transaction/dtos/transaction-input.dto";

export class ExpenseTypeInputDto {
  name: string;
  description: string;
  isTaxDeductible: boolean;
}
