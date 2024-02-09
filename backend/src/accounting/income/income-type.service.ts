import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';
import { IncomeTypeInputDto } from '@alisa-backend/accounting/income/dtos/income-type-input.dto';

@Injectable()
export class IncomeTypeService {
  constructor(
    @InjectRepository(IncomeType)
    private repository: Repository<IncomeType>,
  ) {}

  async findAll(): Promise<IncomeType[]> {
    return this.repository.find();
  }

  async search(options: FindManyOptions<IncomeType>): Promise<IncomeType[]> {
    return this.repository.find(options);
  }

  async findOne(id: number): Promise<IncomeType> {
    return this.repository.findOneBy({ id: id });
  }

  async add(input: IncomeTypeInputDto): Promise<IncomeType> {
    const incomeTypeEntity = new IncomeType();

    this.mapData(incomeTypeEntity, input);

    return await this.repository.save(incomeTypeEntity);
  }

  async update(id: number, input: IncomeTypeInputDto): Promise<IncomeType> {
    const incomeTypeEntity = await this.findOne(id);

    this.mapData(incomeTypeEntity, input);

    await this.repository.save(incomeTypeEntity);
    return incomeTypeEntity;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  private mapData(incomeType: IncomeType, input: IncomeTypeInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        incomeType[key] = value;
      }
    });
  }
}
