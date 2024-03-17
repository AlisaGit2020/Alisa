import { IsNotEmpty } from 'class-validator';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';
import { IncomeInputDto } from '@alisa-backend/accounting/income/dtos/income-input.dto';

export class TransactionInputDto {
  id?: number;

  externalId?: string;

  @IsNotEmpty()
  sender: string = '';

  @IsNotEmpty()
  receiver: string = '';

  @IsNotEmpty()
  description: string = '';

  @IsNotEmpty()
  transactionDate: Date = new Date();

  @IsNotEmpty()
  accountingDate: Date = new Date();

  amount: number = 0;

  propertyId?: number;

  expenses?: ExpenseInputDto[];
  incomes?: IncomeInputDto[];
}
