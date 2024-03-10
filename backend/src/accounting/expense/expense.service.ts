import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseInputDto } from './dtos/expense-input.dto';
import { TransactionInputDto } from '../transaction/dtos/transaction-input.dto';
import { Property } from 'src/real-estate/property/entities/property.entity';
import { ExpenseType } from './entities/expense-type.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';

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
    private authService: AuthService,
  ) {}

  async findAll(): Promise<Expense[]> {
    return this.repository.find();
  }

  async search(
    user: JWTUser,
    options: FindManyOptions<Expense>,
  ): Promise<Expense[]> {
    options.where = this.authService.addOwnershipFilter(user, options.where);

    return this.repository.find(options);
  }

  async findOne(
    user: JWTUser,
    id: number,
    options: FindOneOptions<Expense> = {},
  ): Promise<Expense> {
    options.where = { id: id };
    const expense = await this.repository.findOne(options);
    if (!expense) {
      return null;
    }
    if (!(await this.authService.hasOwnership(user, expense.propertyId))) {
      throw new UnauthorizedException();
    }
    return expense;
  }

  async add(user: JWTUser, input: ExpenseInputDto): Promise<Expense> {
    if (!(await this.authService.hasOwnership(user, input.propertyId))) {
      throw new UnauthorizedException();
    }
    const expenseEntity = new Expense();

    this.mapData(expenseEntity, input);

    return await this.repository.save(expenseEntity);
  }

  async save(user: JWTUser, input: ExpenseInputDto): Promise<Expense> {
    if (input.id > 0) {
      return this.update(user, input.id, input);
    } else {
      return this.add(user, input);
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

  async update(
    user: JWTUser,
    id: number,
    input: ExpenseInputDto,
  ): Promise<Expense> {
    const expenseEntity = await this.getEntityOrThrow(user, id);

    this.mapData(expenseEntity, input);
    expenseEntity.transaction.id = expenseEntity.transactionId;

    await this.repository.save(expenseEntity);
    return expenseEntity;
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    await this.getEntityOrThrow(user, id);
    await this.repository.delete(id);
  }

  private mapData(expense: Expense, input: ExpenseInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        expense[key] = value;
      }
    });

    expense.transaction.propertyId = expense.propertyId;
    expense.transaction.property = expense.property;
  }

  private async getEntityOrThrow(user: JWTUser, id: number): Promise<Expense> {
    const expenseEntity = await this.findOne(user, id, {
      loadRelationIds: true,
    });
    if (!expenseEntity) {
      throw new NotFoundException();
    }
    if (
      !(await this.authService.hasOwnership(user, expenseEntity.propertyId))
    ) {
      throw new UnauthorizedException();
    }
    return expenseEntity;
  }
}
