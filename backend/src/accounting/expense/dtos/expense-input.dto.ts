import { IsNotEmpty, IsNumber, IsObject, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';
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

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  accountingDate?: Date;

  expenseType?: ExpenseTypeInputDto;

  @IsNumber()
  expenseTypeId?: number;

  property?: PropertyInputDto;

  @IsNumber()
  propertyId?: number;

  @IsOptional()
  @IsObject()
  transaction?: TransactionInputDto;

  @IsOptional()
  transactionId?: number | null;
}
