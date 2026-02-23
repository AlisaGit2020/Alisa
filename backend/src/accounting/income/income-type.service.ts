import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { IncomeType } from './entities/income-type.entity';
import { Income } from './entities/income.entity';
import { DeleteValidationDto } from '@asset-backend/common/dtos/delete-validation.dto';
import { IncomeTypeKey } from '@asset-backend/common/types';

@Injectable()
export class IncomeTypeService {
  constructor(
    @InjectRepository(IncomeType)
    private repository: Repository<IncomeType>,
    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
  ) {}

  async findAll(): Promise<IncomeType[]> {
    return this.repository.find();
  }

  async search(
    options: FindManyOptions<IncomeType> = {},
  ): Promise<IncomeType[]> {
    return this.repository.find(options);
  }

  async findOne(id: number): Promise<IncomeType> {
    const incomeType = await this.repository.findOne({ where: { id } });
    return incomeType || null;
  }

  async findByKey(key: IncomeTypeKey): Promise<IncomeType> {
    const incomeType = await this.repository.findOne({ where: { key } });
    return incomeType || null;
  }

  async validateDelete(
    id: number,
  ): Promise<{ validation: DeleteValidationDto; incomeType: IncomeType }> {
    const incomeType = await this.findOne(id);
    if (!incomeType) {
      throw new NotFoundException();
    }

    const incomeCount = await this.incomeRepository.count({
      where: { incomeTypeId: id },
    });

    const dependencies = [];
    if (incomeCount > 0) {
      const samples = await this.incomeRepository.find({
        where: { incomeTypeId: id },
        take: 5,
        order: { id: 'DESC' },
      });
      dependencies.push({
        type: 'income' as const,
        count: incomeCount,
        samples: samples.map((i) => ({ id: i.id, description: i.description })),
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
      incomeType,
    };
  }
}
