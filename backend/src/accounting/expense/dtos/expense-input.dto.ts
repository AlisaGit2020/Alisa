import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { IsNumber, IsObject } from 'class-validator';
import { PropertyInputDto } from '@alisa-backend/real-estate/property/dtos/property-input.dto';

export class ExpenseInputDto {
  expenseType?: ExpenseInputDto;

  @IsNumber()
  expenseTypeId?: number;

  property?: PropertyInputDto;

  @IsNumber()
  propertyId?: number;

  @IsObject()
  transaction: TransactionInputDto = new TransactionInputDto();
}
