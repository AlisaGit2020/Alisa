import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { TransactionInputDto } from './dtos/transaction-input.dto';
import { Transaction } from './entities/transaction.entity';
import { Expense } from '../expense/entities/expense.entity';
import { Income } from '../income/entities/income.entity';
import { typeormWhereTransformer } from '@alisa-backend/common/transformer/typeorm-where.transformer';
import { TransactionStatisticsDto } from './dtos/transaction-statistics.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private repository: Repository<Transaction>,

    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,

    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
  ) {}

  async search(options: FindManyOptions<Transaction>): Promise<Transaction[]> {
    if (options.where !== undefined) {
      options.where = typeormWhereTransformer(options.where);
    }

    return this.repository.find(options);
  }

  async findAll(): Promise<Transaction[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<Transaction> {
    return this.repository.findOneBy({ id: id });
  }

  async add(input: TransactionInputDto): Promise<Transaction> {
    const transactionEntity = new Transaction();

    this.mapData(transactionEntity, input);

    return await this.repository.save(transactionEntity);
  }

  async update(id: number, input: TransactionInputDto): Promise<Transaction> {
    const transactionEntity = await this.findOne(id);

    this.mapData(transactionEntity, input);

    await this.repository.save(transactionEntity);
    return transactionEntity;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async statistics(
    options: FindManyOptions<Transaction>,
  ): Promise<TransactionStatisticsDto> {
    const queryBuilder = this.repository.createQueryBuilder('transaction');

    if (options.relations !== undefined) {
      let relations = [];
      if (Array.isArray(options.relations)) {
        relations = options.relations;
      } else {
        relations = Object.entries(options.relations)
          .filter(([key, value]) => value === true)
          .map(([key]) => key);
      }

      for (const relation of relations) {
        queryBuilder.leftJoinAndSelect(
          `transaction.${relation}`,
          relation as string,
        );
      }
    }

    if (options.where !== undefined) {
      options.where = typeormWhereTransformer(options.where);
      queryBuilder.where(options.where);
    }

    const result = await queryBuilder
      .select('COUNT(transaction.id)', 'rowCount')
      .addSelect(
        'SUM(CASE WHEN transaction.totalAmount < 0 THEN (transaction.totalAmount * -1) ELSE 0 END)',
        'totalExpenses',
      )
      .addSelect(
        'SUM(CASE WHEN transaction.totalAmount > 0 THEN transaction.totalAmount ELSE 0 END)',
        'totalIncomes',
      )
      .addSelect('SUM(transaction.totalAmount)', 'total')
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
  }
}
