import { FindOptionsWhere } from 'typeorm';

export type BetweenDates = {
  $between: [string, string];
};

export type FindOptionsWhereWithUserId<T> = FindOptionsWhere<T> & {
  userId: number;
};
