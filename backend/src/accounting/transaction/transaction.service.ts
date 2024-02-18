import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindManyOptions, Repository } from 'typeorm';
import { TransactionInputDto } from './dtos/transaction-input.dto';
import { Transaction } from './entities/transaction.entity';
import { Expense } from '../expense/entities/expense.entity';
import { Income } from '../income/entities/income.entity';
import { BetweenDates } from '@alisa-backend/common/types';
import { typeormWhereTransformer } from '@alisa-backend/common/transformer/typeorm-where.transformer';

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
    const expense = await this.expenseRepository.findOne({
      where: { transaction: { id: id } },
    });
    const expenseId = expense?.id;

    if (expenseId) {
      await this.expenseRepository.delete(expenseId);
    }

    const income = await this.incomeRepository.findOne({
      where: { transaction: { id: id } },
    });
    const incomeId = income?.id;

    if (incomeId) {
      await this.incomeRepository.delete(incomeId);
    }

    this.repository.delete(id);
  }

  private mapData(transaction: Transaction, input: TransactionInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        transaction[key] = value;
      }
    });
  }
}
