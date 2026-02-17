import { Repository, SelectQueryBuilder } from 'typeorm';

export type MockEntityManager = {
  remove: jest.Mock;
  delete: jest.Mock;
  save: jest.Mock;
};

export type MockRepository<T> = Omit<
  Partial<Record<keyof Repository<T>, jest.Mock>>,
  'manager' | 'createQueryBuilder'
> & {
  createQueryBuilder: jest.Mock;
  manager: {
    transaction: jest.Mock;
  };
};

export const createMockQueryBuilder = <T>(): Partial<
  Record<keyof SelectQueryBuilder<T>, jest.Mock>
> => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
  execute: jest.fn(),
});

export const createMockEntityManager = (): MockEntityManager => ({
  remove: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(),
});

export const createMockRepository = <T>(): MockRepository<T> => {
  const mockQueryBuilder = createMockQueryBuilder<T>();
  const mockEntityManager = createMockEntityManager();

  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    exist: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    manager: {
      transaction: jest.fn((callback) => callback(mockEntityManager)),
    },
  };
};
