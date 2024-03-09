import {IsNotEmpty, IsNumber, IsObject, Min} from 'class-validator';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { PropertyInputDto } from '@alisa-backend/real-estate/property/dtos/property-input.dto';
import { ExpenseTypeInputDto } from '@alisa-backend/accounting/expense/dtos/expense-type-input.dto';

export class ExpenseInputDto {
  id?: number;

  @IsNotEmpty()
  description: string = '';

  amount: number = 0;

  @Min(1)
  quantity: number = 1;

  @Min(0.01)
  totalAmount: number = 0;

  expenseType?: ExpenseTypeInputDto;

  @IsNumber()
  expenseTypeId?: number;

  property?: PropertyInputDto;

  @IsNumber()
  propertyId?: number;

  @IsObject()
  transaction: TransactionInputDto = new TransactionInputDto();
}
