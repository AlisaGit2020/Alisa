import { TransactionType } from '@alisa-backend/common/types';

export class TransactionSetTypeInputDto {
  ids: number[];
  type: TransactionType;
}
