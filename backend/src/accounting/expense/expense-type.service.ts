import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { ExpenseType } from './entities/expense-type.entity';
import { Expense } from './entities/expense.entity';
import { DeleteValidationDto } from '@alisa-backend/common/dtos/delete-validation.dto';
import { ExpenseTypeKey } from '@alisa-backend/common/types';

@Injectable()
export class ExpenseTypeService {
  constructor(
    @InjectRepository(ExpenseType)
    private repository: Repository<ExpenseType>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async findAll(): Promise<ExpenseType[]> {
    return this.repository.find();
  }

  async search(
    options: FindManyOptions<ExpenseType> = {},
  ): Promise<ExpenseType[]> {
    return this.repository.find(options);
  }

  async findOne(id: number): Promise<ExpenseType> {
    const expenseType = await this.repository.findOne({ where: { id } });
    return expenseType || null;
  }

  async findByKey(key: ExpenseTypeKey): Promise<ExpenseType> {
    const expenseType = await this.repository.findOne({ where: { key } });
    return expenseType || null;
  }

  async validateDelete(
    id: number,
  ): Promise<{ validation: DeleteValidationDto; expenseType: ExpenseType }> {
    const expenseType = await this.findOne(id);
    if (!expenseType) {
      throw new NotFoundException();
    }

    const expenseCount = await this.expenseRepository.count({
      where: { expenseTypeId: id },
    });

    const dependencies = [];
    if (expenseCount > 0) {
      const samples = await this.expenseRepository.find({
        where: { expenseTypeId: id },
        take: 5,
        order: { id: 'DESC' },
      });
      dependencies.push({
        type: 'expense' as const,
        count: expenseCount,
        samples: samples.map((e) => ({ id: e.id, description: e.description })),
      });
    }

    return {
      validation: {
        canDelete: true,
        dependencies,
        message:
          dependencies.length > 0
            ? 'The following related data will be deleted'
            : undefined,
      },
      expenseType,
    };
  }
}
