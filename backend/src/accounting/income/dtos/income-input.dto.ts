import { IsNumber, IsObject } from 'class-validator';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { PropertyInputDto } from '@alisa-backend/real-estate/property/dtos/property-input.dto';
import { IncomeTypeInputDto } from '@alisa-backend/accounting/income/dtos/income-type-input.dto';

export class IncomeInputDto {
  incomeType?: IncomeTypeInputDto;

  @IsNumber()
  incomeTypeId?: number;

  property?: PropertyInputDto;

  @IsNumber()
  propertyId?: number;

  @IsObject()
  transaction: TransactionInputDto = new TransactionInputDto();
}
