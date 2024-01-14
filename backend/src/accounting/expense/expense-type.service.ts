import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseType } from './entities/expense-type.entity';
import { ExpenseTypeInputDto } from './dtos/expense-type-input.dto';

@Injectable()
export class ExpenseTypeService {
  constructor(
    @InjectRepository(ExpenseType)
    private expenseTypeRepository: Repository<ExpenseType>,
  ) {}

  async findAll(): Promise<ExpenseType[]> {
    return this.expenseTypeRepository.find();
  }

  async findOne(id: number): Promise<ExpenseType> {
    return this.expenseTypeRepository.findOneBy({ id: id });
  }

  async add(input: ExpenseTypeInputDto): Promise<ExpenseType> {
    const expenseTypeEntity = new ExpenseType();

    this.mapData(expenseTypeEntity, input);

    return await this.expenseTypeRepository.save(expenseTypeEntity);
  }

  async update(id: number, input: ExpenseTypeInputDto): Promise<ExpenseType> {
    const expenseTypeTypeEntity = await this.findOne(id);

    this.mapData(expenseTypeTypeEntity, input);

    await this.expenseTypeRepository.save(expenseTypeTypeEntity);
    return expenseTypeTypeEntity;
  }

  async delete(id: number): Promise<void> {
    await this.expenseTypeRepository.delete(id);
  }

  private mapData(expenseType: ExpenseType, input: ExpenseTypeInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        expenseType[key] = value;
      }
    });
  }
}
