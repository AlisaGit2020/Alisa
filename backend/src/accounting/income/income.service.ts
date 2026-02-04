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
import { typeormWhereTransformer } from '@alisa-backend/common/transformer/typeorm-where.transformer';

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
    if (options.where !== undefined) {
      options.where = typeormWhereTransformer(options.where);
    }
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
    const incomeTypes = await this.incomeTypeRepository.find({
      take: 1,
      order: { name: 'ASC' },
    });

    const income = new IncomeInputDto();
    income.incomeTypeId = incomeTypes[0].id;
    income.description = incomeTypes[0].name;

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
    const income = await this.getEntityOrThrow(user, id);
    const transactionId = income.transactionId;

    // Delete the income
    await this.repository.delete(id);

    // Delete associated transaction if it exists
    if (transactionId) {
      await this.transactionRepository.delete(transactionId);
    }
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
      // Copy accountingDate from transaction if not explicitly set
      if (!income.accountingDate && income.transaction.accountingDate) {
        income.accountingDate = income.transaction.accountingDate;
      }
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
