import { IsNotEmpty, IsNumber, IsObject, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { PropertyInputDto } from '@alisa-backend/real-estate/property/dtos/property-input.dto';
import { IncomeTypeInputDto } from '@alisa-backend/accounting/income/dtos/income-type-input.dto';
import { normalizeAccountingDate } from '@alisa-backend/common/utils/date-normalizer';
import { IsValidDate } from '@alisa-backend/common/validators/is-valid-date.validator';

export class IncomeInputDto {
  id?: number;

  @IsNotEmpty()
  description: string = '';

  amount: number = 0;

  @Min(1)
  quantity: number = 1;

  @Min(0.01)
  totalAmount: number = 0;

  @IsOptional()
  @Transform(({ value }) => normalizeAccountingDate(value))
  @IsValidDate()
  accountingDate?: Date;

  incomeType?: IncomeTypeInputDto;

  @IsNumber()
  incomeTypeId?: number;

  property?: PropertyInputDto;

  @IsNumber()
  propertyId?: number;

  @IsOptional()
  @IsObject()
  transaction?: TransactionInputDto;

  @IsOptional()
  transactionId?: number | null;
}
