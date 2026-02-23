import { IsNotEmpty, IsNumber, IsObject, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { TransactionInputDto } from '@asset-backend/accounting/transaction/dtos/transaction-input.dto';
import { PropertyInputDto } from '@asset-backend/real-estate/property/dtos/property-input.dto';
import { normalizeAccountingDate } from '@asset-backend/common/utils/date-normalizer';
import { IsValidDate } from '@asset-backend/common/validators/is-valid-date.validator';
import { toNumber } from '@asset-backend/common/transformer/to-number.transformer';

export class IncomeInputDto {
  id?: number;

  @IsNotEmpty()
  description: string = '';

  @Transform(toNumber(0))
  amount: number = 0;

  @Transform(toNumber(1))
  @Min(1)
  quantity: number = 1;

  @Transform(toNumber(0))
  @Min(0.01)
  totalAmount: number = 0;

  @IsOptional()
  @Transform(({ value }) => normalizeAccountingDate(value))
  @IsValidDate()
  accountingDate?: Date;

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
