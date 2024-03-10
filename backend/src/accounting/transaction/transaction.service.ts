import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { TransactionInputDto } from './dtos/transaction-input.dto';
import { Transaction } from './entities/transaction.entity';
import { typeormWhereTransformer } from '@alisa-backend/common/transformer/typeorm-where.transformer';
import { TransactionStatisticsDto } from './dtos/transaction-statistics.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private repository: Repository<Transaction>,

    private authService: AuthService,
  ) {}

  async search(
    user: JWTUser,
    options: FindManyOptions<Transaction>,
  ): Promise<Transaction[]> {
    if (options.where !== undefined) {
      options.where = typeormWhereTransformer(options.where);
    }
    options.where = this.authService.addOwnershipFilter(user, options.where);
    return this.repository.find(options);
  }

  async findOne(user: JWTUser, id: number): Promise<Transaction> {
    const transaction = await this.repository.findOneBy({ id: id });

    if (!transaction) {
      return null;
    }

    if (!(await this.authService.hasOwnership(user, transaction.propertyId))) {
      throw new UnauthorizedException();
    }

    return transaction;
  }

  async add(user: JWTUser, input: TransactionInputDto): Promise<Transaction> {
    const hasOwnership = await this.authService.hasOwnership(
      user,
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
    await this.getEntityOrThrow(user, id);

    const transactionEntity = await this.findOne(user, id);
    this.mapData(transactionEntity, input);

    await this.repository.save(transactionEntity);
    return transactionEntity;
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    await this.getEntityOrThrow(user, id);
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

  private async getEntityOrThrow(
    user: JWTUser,
    id: number,
  ): Promise<Transaction> {
    const entity = await this.findOne(user, id);
    if (!entity) {
      throw new NotFoundException();
    }
    if (!(await this.authService.hasOwnership(user, entity.propertyId))) {
      throw new UnauthorizedException();
    }
    return entity;
  }
}
