export class TransactionInputDto {
  description: string = '';
  transactionDate: Date;
  accountingDate: Date;
  amount: number = 1;
  quantity: number = 0;
  totalAmount: number = 0;
}
