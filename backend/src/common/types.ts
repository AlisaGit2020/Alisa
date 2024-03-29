import { FindOptionsWhere } from 'typeorm';

export enum TransactionType {
  INCOME = 1,
  EXPENSE = 2,
  DEPOSIT = 3,
  WITHDRAW = 4,
}

export type BetweenDates = {
  $between: [string, string];
};

export type FindOptionsWhereWithUserId<T> = FindOptionsWhere<T> & {
  userId: number;
};
