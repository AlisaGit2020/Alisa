export type TypeOrmOrderOption = {
  [key: string]: "ASC" | "DESC";
};

export type TypeOrmRelationOption = {
  [key: string]: boolean | TypeOrmRelationOption;
};

export type TypeOrmFetchOptions<T> = {
  relations?: TypeOrmRelationOption;
  select?: string[];
  where?: Partial<T>;
  order?: TypeOrmOrderOption;
  limit?: number;
};

export type DTO<T> = T & {
  id: number;
};

export type TObject<T> = T & object;

export type TransactionRow = {
  id: number;
  description: string;
  amount: number;
  quantity: number;
  totalAmount: number;
  expenseTypeId?: number;
  incomeTypeId?: number;
};
