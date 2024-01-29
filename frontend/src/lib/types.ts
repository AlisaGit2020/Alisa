export type TypeOrmOrderOption = {
    [key: string]: 'ASC' | 'DESC';
};

  
export type TypeOrmRelationOption = {
    [key: string]: boolean
};

export type TypeOrmFetchOptions<T> = {
    relations?: TypeOrmRelationOption,
    where?: Partial<T>,
    order?: TypeOrmOrderOption
};

export type DTO<T> = T & {
    id: number;
};

export type TObject<T> = T & object