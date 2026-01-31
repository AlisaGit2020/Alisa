export type TypeOrmOrderOption = {
  [key: string]: "ASC" | "DESC";
};

export type TypeOrmRelationOption = {
  [key: string]: boolean | TypeOrmRelationOption;
};

export type TypeOrmWhereOption<T> = {
  [K in keyof T]?:
    | T[K]
    | { $between?: T[K][] }
    | { $in?: T[K][] }
    | { $ilike?: string }
    | { $gte?: T[K] }
    | { $lte?: T[K] };
};

export type TypeOrmFetchOptions<T> = {
  relations?: TypeOrmRelationOption;
  select?: string[];
  where?: TypeOrmWhereOption<T> & Record<string, unknown>;
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

export type AlisaSelectVariantType =
  | "select"
  | "radio"
  | "button"
  | "split-button";
