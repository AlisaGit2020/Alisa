import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, In, Repository } from 'typeorm';
import { TransactionInputDto } from './dtos/transaction-input.dto';
import { Transaction } from './entities/transaction.entity';
import { typeormWhereTransformer } from '@alisa-backend/common/transformer/typeorm-where.transformer';
import { TransactionStatisticsDto } from './dtos/transaction-statistics.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { UserService } from '@alisa-backend/people/user/user.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private repository: Repository<Transaction>,

    private userService: UserService,
  ) {}

  async search(
    user: JWTUser,
    options: FindManyOptions<Transaction>,
  ): Promise<Transaction[]> {
    if (options.where !== undefined) {
      options.where = typeormWhereTransformer(options.where);
    }
    options.where = this.addOwnershipFilter(user, options.where);
    return this.repository.find(options);
  }

  addOwnershipFilter(
    user: JWTUser,
    where: FindOptionsWhere<Transaction> | FindOptionsWhere<Transaction>[],
  ): FindOptionsWhere<Transaction> | FindOptionsWhere<Transaction>[] {
    if (Array.isArray(where)) {
      for (const index in where) {
        where[index] = this.addOwnershipFilter(
          user,
          where[index],
        ) as FindOptionsWhere<Transaction>;
      }
    } else {
      if (where === undefined) {
        where = {} as FindOptionsWhere<Transaction>;
      }

      const ownershipFilter = { ownerships: [{ userId: user.id }] };

      if (where.property === undefined) {
        where.property = {
          ...ownershipFilter,
        };
      } else {
        where.property = {
          ...(where.property as object),
          ...ownershipFilter,
        };
      }
    }

    return where;
  }

  async findOne(id: number): Promise<Transaction> {
    return this.repository.findOneBy({ id: id });
  }

  async add(user: JWTUser, input: TransactionInputDto): Promise<Transaction> {
    const hasOwnership = await this.userService.hasOwnership(
      user.id,
      input.propertyId,
    );
    if (!hasOwnership) {
      throw new UnauthorizedException();
    }

    const transactionEntity = new Transaction();

    this.mapData(transactionEntity, input);

    return await this.repository.save(transactionEntity);
  }

  async update(
    user: JWTUser,
    id: number,
    input: TransactionInputDto,
  ): Promise<Transaction> {
    await this.validateId(user, id);

    const transactionEntity = await this.findOne(id);
    this.mapData(transactionEntity, input);

    await this.repository.save(transactionEntity);
    return transactionEntity;
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    await this.validateId(user, id);
    await this.repository.delete(id);
  }

  async statistics(
    user: JWTUser,
    options: FindManyOptions<Transaction>,
  ): Promise<TransactionStatisticsDto> {
    const queryBuilder = this.repository.createQueryBuilder('transaction');

    if (options.where === undefined) {
      options.where = {};
    } else {
      options.where = typeormWhereTransformer(options.where);
    }

    const result = await queryBuilder
      .select('COUNT(transaction.id)', 'rowCount')
      .addSelect(
        'SUM(CASE WHEN transaction.amount < 0 THEN (transaction.amount * -1) ELSE 0 END)',
        'totalExpenses',
      )
      .addSelect(
        'SUM(CASE WHEN transaction.amount > 0 THEN transaction.amount ELSE 0 END)',
        'totalIncomes',
      )
      .addSelect('SUM(transaction.amount)', 'total')
      .leftJoin('transaction.property', 'property')
      .leftJoin('property.ownerships', 'ownership')
      .where(options.where)
      .andWhere('ownership.userId = :userId', { userId: user.id })
      .getRawOne();

    return {
      rowCount: Number(result.rowCount),
      totalExpenses: Number(result.totalExpenses),
      totalIncomes: Number(result.totalIncomes),
      total: Number(result.total),
    };
  }

  private mapData(transaction: Transaction, input: TransactionInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        transaction[key] = value;
      }
    });

    if (input.expenses !== undefined) {
      for (const expense of input.expenses) {
        expense.propertyId = transaction.propertyId;
      }
    }
    if (input.incomes !== undefined) {
      for (const income of input.incomes) {
        income.propertyId = transaction.propertyId;
      }
    }
  }

  private async validateId(user: JWTUser, id: number): Promise<void> {
    const hasOwnership = await this.repository.exist({
      where: {
        id: id,
        property: {
          ownerships: {
            userId: In([user.id]),
          },
        },
      },
    });

    if (!hasOwnership) {
      throw new UnauthorizedException();
    }
  }
}
