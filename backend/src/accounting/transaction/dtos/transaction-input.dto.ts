import { IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';
import { IncomeInputDto } from '@alisa-backend/accounting/income/dtos/income-input.dto';
import {
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';
import { normalizeAccountingDate } from '@alisa-backend/common/utils/date-normalizer';

export class TransactionInputDto {
  id?: number;
  externalId?: string;
  status?: TransactionStatus = TransactionStatus.PENDING;
  type?: TransactionType = TransactionType.UNKNOWN;

  @IsNotEmpty()
  sender: string = '';

  @IsNotEmpty()
  receiver: string = '';

  @IsNotEmpty()
  description: string = '';

  @IsNotEmpty()
  @Transform(({ value }) => normalizeAccountingDate(value))
  transactionDate: Date = new Date();

  @IsNotEmpty()
  @Transform(({ value }) => normalizeAccountingDate(value))
  accountingDate: Date = new Date();

  amount: number = 0;

  propertyId?: number;

  expenses?: ExpenseInputDto[];
  incomes?: IncomeInputDto[];
}
