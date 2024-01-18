
import { TransactionInputDto } from 'src/accounting/transaction/dtos/transaction-input.dto';
import { ExpenseTypeInputDto } from './expense-type-input.dto';
import { PropertyInputDto } from 'src/real-estate/property/dtos/property-input.dto';
import { IsNotEmpty } from 'class-validator';

export class ExpenseInputDto {
  @IsNotEmpty()
  id?: number;

  expenseType: ExpenseTypeInputDto | number;

  property: PropertyInputDto | number;

  transaction: TransactionInputDto;
}
