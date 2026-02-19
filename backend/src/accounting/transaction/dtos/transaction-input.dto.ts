import { IsNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';
import { IncomeInputDto } from '@alisa-backend/accounting/income/dtos/income-input.dto';
import {
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';
import { normalizeAccountingDate } from '@alisa-backend/common/utils/date-normalizer';
import { IsValidDate } from '@alisa-backend/common/validators/is-valid-date.validator';

// Helper to transform empty strings to numbers
const toNumber = (defaultValue: number) => ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) {
    return defaultValue;
  }
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

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
  @IsValidDate()
  transactionDate: Date = new Date();

  @IsNotEmpty()
  @Transform(({ value }) => normalizeAccountingDate(value))
  @IsValidDate()
  accountingDate: Date = new Date();

  @Transform(toNumber(0))
  amount: number = 0;

  propertyId?: number;

  @Type(() => ExpenseInputDto)
  expenses?: ExpenseInputDto[];

  @Type(() => IncomeInputDto)
  incomes?: IncomeInputDto[];
}
