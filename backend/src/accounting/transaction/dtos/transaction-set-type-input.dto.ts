import { TransactionType } from '@asset-backend/common/types';

export class TransactionSetTypeInputDto {
  ids: number[];
  type: TransactionType;
}
