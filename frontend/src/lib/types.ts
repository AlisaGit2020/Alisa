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