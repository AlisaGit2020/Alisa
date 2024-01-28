import { IsNotEmpty, Min } from 'class-validator';

export class TransactionInputDto {
  @IsNotEmpty()
  description: string = '';

  transactionDate: Date;

  accountingDate: Date;

  amount: number = 0;

  @Min(1)
  quantity: number = 1;

  @Min(0.01)
  totalAmount: number = 0;
}
