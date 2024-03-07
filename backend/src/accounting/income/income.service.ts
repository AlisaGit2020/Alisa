import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Income } from './entities/income.entity';
import { IncomeInputDto } from './dtos/income-input.dto';
import { TransactionInputDto } from '../transaction/dtos/transaction-input.dto';
import { Property } from 'src/real-estate/property/entities/property.entity';
import { IncomeType } from './entities/income-type.entity';
import { Transaction } from '../transaction/entities/transaction.entity';

@Injectable()
export class IncomeService {
  constructor(
    @InjectRepository(Income)
    private repository: Repository<Income>,

    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,

    @InjectRepository(IncomeType)
    private incomeTypeRepository: Repository<IncomeType>,

    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async findAll(): Promise<Income[]> {
    return this.repository.find();
  }

  async search(options: FindManyOptions<Income>): Promise<Income[]> {
    return this.repository.find(options);
  }

  async findOne(
    id: number,
    options: FindOneOptions<Income> = {},
  ): Promise<Income> {
    options.where = { id: id };
    const income = await this.repository.findOne(options);
    return income;
  }

  async add(input: IncomeInputDto): Promise<Income> {
    const incomeEntity = new Income();

    this.mapData(incomeEntity, input);

    return await this.repository.save(incomeEntity);
  }

  async save(input: IncomeInputDto): Promise<Income> {
    if (input.id > 0) {
      return this.update(input.id, input);
    } else {
      return this.add(input);
    }
  }

  async getDefault(): Promise<IncomeInputDto> {
    const properties = await this.propertyRepository.find({
      take: 1,
      order: { name: 'ASC' },
    });

    const incomeTypes = await this.incomeTypeRepository.find({
      take: 1,
      order: { name: 'ASC' },
    });

    const income = new IncomeInputDto();
    income.propertyId = properties[0].id;
    income.incomeTypeId = incomeTypes[0].id;
    income.transaction = new TransactionInputDto();
    income.transaction.accountingDate = new Date();
    income.transaction.transactionDate = new Date();
    return income;
  }

  async update(id: number, input: IncomeInputDto): Promise<Income> {
    const incomeEntity = await this.findOne(id, {
      relations: { transaction: true },
    });

    this.mapData(incomeEntity, input);
    incomeEntity.transaction.id = incomeEntity.transactionId;

    await this.repository.save(incomeEntity);
    return incomeEntity;
  }

  async delete(id: number): Promise<void> {
    const income = await this.findOne(id);
    await this.repository.delete(id);
    await this.transactionRepository.delete(income.transactionId);
  }

  private mapData(income: Income, input: IncomeInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        income[key] = value;
      }
    });

    income.transaction.propertyId = income.propertyId;
    income.transaction.property = income.property;
  }
}
