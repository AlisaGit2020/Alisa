import { TransactionInputDto } from "src/accounting/transaction/dtos/transaction-input.dto";
import { ExpenseTypeInputDto } from "./expense-type-input.dto";

export class ExpenseInputDto {
  expenseType: ExpenseTypeInputDto;
  transaction: TransactionInputDto;
}
