import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Income } from './entities/income.entity';
import { IncomeInputDto } from './dtos/income-input.dto';
import { TransactionInputDto } from '../transaction/dtos/transaction-input.dto';
import { Property } from 'src/real-estate/property/entities/property.entity';
import { IncomeType } from './entities/income-type.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';

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
    private authService: AuthService,
  ) {}

  async search(
    user: JWTUser,
    options: FindManyOptions<Income>,
  ): Promise<Income[]> {
    options.where = this.authService.addOwnershipFilter(user, options.where);

    return this.repository.find(options);
  }

  async findOne(
    user: JWTUser,
    id: number,
    options: FindOneOptions<Income> = {},
  ): Promise<Income> {
    options.where = { id: id };
    const income = await this.repository.findOne(options);
    if (!income) {
      return null;
    }
    if (!(await this.authService.hasOwnership(user, income.propertyId))) {
      throw new UnauthorizedException();
    }
    return income;
  }

  async add(user: JWTUser, input: IncomeInputDto): Promise<Income> {
    if (!(await this.authService.hasOwnership(user, input.propertyId))) {
      throw new UnauthorizedException();
    }
    const incomeEntity = new Income();

    this.mapData(incomeEntity, input);

    return await this.repository.save(incomeEntity);
  }

  async save(user: JWTUser, input: IncomeInputDto): Promise<Income> {
    if (input.id > 0) {
      return this.update(user, input.id, input);
    } else {
      return this.add(user, input);
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

  async update(
    user: JWTUser,
    id: number,
    input: IncomeInputDto,
  ): Promise<Income> {
    const incomeEntity = await this.getEntityOrThrow(user, id);

    this.mapData(incomeEntity, input);
    if (incomeEntity.transaction !== undefined) {
      incomeEntity.transaction.id = incomeEntity.transactionId;
    }

    await this.repository.save(incomeEntity);
    return incomeEntity;
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    await this.getEntityOrThrow(user, id);
    await this.repository.delete(id);
  }

  private mapData(income: Income, input: IncomeInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        income[key] = value;
      }
    });

    if (income.transaction !== undefined) {
      income.transaction.propertyId = income.propertyId;
      income.transaction.property = income.property;
    }
  }

  private async getEntityOrThrow(user: JWTUser, id: number): Promise<Income> {
    const incomeEntity = await this.findOne(user, id);
    if (!incomeEntity) {
      throw new NotFoundException();
    }
    if (!(await this.authService.hasOwnership(user, incomeEntity.propertyId))) {
      throw new UnauthorizedException();
    }
    return incomeEntity;
  }
}
