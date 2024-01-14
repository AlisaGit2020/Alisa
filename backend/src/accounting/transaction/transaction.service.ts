import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionInputDto } from './dtos/transaction-input.dto';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private repository: Repository<Transaction>,
  ) {}

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

  private mapData(transaction: Transaction, input: TransactionInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        transaction[key] = value;
      }
    });
  }
}
