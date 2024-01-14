import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseInputDto } from './dtos/expense-input.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private repository: Repository<Expense>,
  ) {}

  async findAll(): Promise<Expense[]> {
    return this.repository.find();
  }

  async search(options: FindManyOptions<Expense>): Promise<Expense[]> {
    return this.repository.find(options);
  }

  async findOne(id: number): Promise<Expense> {
    return this.repository.findOneBy({ id: id });
  }

  async add(input: ExpenseInputDto): Promise<Expense> {
    const expenseEntity = new Expense();

    this.mapData(expenseEntity, input);

    return await this.repository.save(expenseEntity);
  }

  async update(id: number, input: ExpenseInputDto): Promise<Expense> {
    const expenseEntity = await this.findOne(id);

    const transactionId = expenseEntity.transaction.id;
    this.mapData(expenseEntity, input);
    expenseEntity.transaction.id = transactionId;

    await this.repository.save(expenseEntity);
    return expenseEntity;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  private mapData(expense: Expense, input: ExpenseInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        expense[key] = value;
      }
    });
  }
}
