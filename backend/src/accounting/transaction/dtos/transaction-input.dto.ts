export class TransactionInputDto {
  description: string = '';
  transactionDate: Date;
  accountingDate: Date;
  amount: number = 0;
  quantity: number = 1;
  totalAmount: number = 0;
}
