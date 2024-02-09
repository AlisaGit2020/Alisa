import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { ExpenseType } from './entities/expense-type.entity';
import { ExpenseTypeInputDto } from './dtos/expense-type-input.dto';

@Injectable()
export class ExpenseTypeService {
  constructor(
    @InjectRepository(ExpenseType)
    private repository: Repository<ExpenseType>,
  ) {}

  async findAll(): Promise<ExpenseType[]> {
    return this.repository.find();
  }

  async search(options: FindManyOptions<ExpenseType>): Promise<ExpenseType[]> {
    return this.repository.find(options);
  }

  async findOne(id: number): Promise<ExpenseType> {
    return this.repository.findOneBy({ id: id });
  }

  async add(input: ExpenseTypeInputDto): Promise<ExpenseType> {
    const expenseTypeEntity = new ExpenseType();

    this.mapData(expenseTypeEntity, input);

    return await this.repository.save(expenseTypeEntity);
  }

  async update(id: number, input: ExpenseTypeInputDto): Promise<ExpenseType> {
    const expenseTypeEntity = await this.findOne(id);

    this.mapData(expenseTypeEntity, input);

    await this.repository.save(expenseTypeEntity);
    return expenseTypeEntity;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  private mapData(expenseType: ExpenseType, input: ExpenseTypeInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        expenseType[key] = value;
      }
    });
  }
}
