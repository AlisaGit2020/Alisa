import { IsNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ExpenseInputDto } from '@asset-backend/accounting/expense/dtos/expense-input.dto';
import { IncomeInputDto } from '@asset-backend/accounting/income/dtos/income-input.dto';
import {
  TransactionStatus,
  TransactionType,
} from '@asset-backend/common/types';
import { normalizeAccountingDate } from '@asset-backend/common/utils/date-normalizer';
import { IsValidDate } from '@asset-backend/common/validators/is-valid-date.validator';
import { toNumber } from '@asset-backend/common/transformer/to-number.transformer';

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
