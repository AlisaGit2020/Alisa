import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseInputDto } from './dtos/expense-input.dto';
import { TransactionInputDto } from '../transaction/dtos/transaction-input.dto';
import { Property } from 'src/real-estate/property/entities/property.entity';
import { ExpenseType } from './entities/expense-type.entity';
import { Transaction } from '../transaction/entities/transaction.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private repository: Repository<Expense>,

    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,

    @InjectRepository(ExpenseType)
    private expenseTypeRepository: Repository<ExpenseType>,

    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async findAll(): Promise<Expense[]> {
    return this.repository.find();
  }

  async search(options: FindManyOptions<Expense>): Promise<Expense[]> {
    return this.repository.find(options);
  }

  async findOne(
    id: number,
    options: FindOneOptions<Expense> = {},
  ): Promise<Expense> {
    options.where = { id: id };
    const expense = await this.repository.findOne(options);
    return expense;
  }

  async add(input: ExpenseInputDto): Promise<Expense> {
    const expenseEntity = new Expense();

    this.mapData(expenseEntity, input);

    return await this.repository.save(expenseEntity);
  }

  async save(input: ExpenseInputDto): Promise<Expense> {
    if (input.id > 0) {
      return this.update(input.id, input);
    } else {
      return this.add(input);
    }
  }

  async getDefault(): Promise<ExpenseInputDto> {
    const properties = await this.propertyRepository.find({
      take: 1,
      order: { name: 'ASC' },
    });

    const expenseTypes = await this.expenseTypeRepository.find({
      take: 1,
      order: { name: 'ASC' },
    });

    const expense = new ExpenseInputDto();
    expense.propertyId = properties[0].id;
    expense.expenseTypeId = expenseTypes[0].id;
    expense.transaction = new TransactionInputDto();
    expense.transaction.accountingDate = new Date();
    expense.transaction.transactionDate = new Date();
    return expense;
  }

  async update(id: number, input: ExpenseInputDto): Promise<Expense> {
    const expenseEntity = await this.findOne(id, {
      relations: { transaction: true },
    });

    this.mapData(expenseEntity, input);
    expenseEntity.transaction.id = expenseEntity.transactionId;

    await this.repository.save(expenseEntity);
    return expenseEntity;
  }

  async delete(id: number): Promise<void> {
    const expense = await this.findOne(id);
    await this.repository.delete(id);
    await this.transactionRepository.delete(expense.transactionId);
  }

  private mapData(expense: Expense, input: ExpenseInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        expense[key] = value;
      }
    });

    expense.transaction.propertyId = expense.propertyId;
    expense.transaction.property = expense.property

    if (expense.transaction.amount > 0) {
      expense.transaction.amount = expense.transaction.amount * -1;
    }
  }
}
