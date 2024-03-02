export type TypeOrmOrderOption = {
    [key: string]: 'ASC' | 'DESC';
};

  
export type TypeOrmRelationOption = {
    [key: string]: boolean | TypeOrmRelationOption
};

export type TypeOrmFetchOptions<T> = {
    relations?: TypeOrmRelationOption,
    where?: Partial<T>,
    order?: TypeOrmOrderOption
    limit?: number
};

export type DTO<T> = T & {
    id: number;
};

export type TObject<T> = T & object