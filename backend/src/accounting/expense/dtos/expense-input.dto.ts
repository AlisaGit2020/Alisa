import { TransactionInputDto } from 'src/accounting/transaction/dtos/transaction-input.dto';
import { IsNumber, IsObject } from 'class-validator';
import { PropertyInputDto } from 'src/real-estate/property/dtos/property-input.dto';

export class ExpenseInputDto {
  id: number;

  expenseType?: ExpenseInputDto;

  @IsNumber()
  expenseTypeId?: number;

  property?: PropertyInputDto;

  @IsNumber()
  propertyId?: number;

  @IsObject()
  transaction: TransactionInputDto;
}
