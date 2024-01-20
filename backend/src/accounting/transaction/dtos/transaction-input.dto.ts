export class TransactionInputDto {
  description: string = '';
  transactionDate: Date;
  accountingDate: Date;
  amount: number = 0;
  quantity: number = 0;
  totalAmount: number = 0;
}
