import { TransactionInputDto } from "src/accounting/transaction/dtos/transaction-input.dto";
import { ExpenseTypeInputDto } from "./expense-type-input.dto";
import { PropertyInputDto } from "src/real-estate/property/dtos/property-input.dto";

export class ExpenseInputDto {
  expenseType: ExpenseTypeInputDto;
  property: PropertyInputDto;
  transaction: TransactionInputDto;
}
