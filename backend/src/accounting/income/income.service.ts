import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, In, Repository } from 'typeorm';
import { Income } from './entities/income.entity';
import { IncomeInputDto } from './dtos/income-input.dto';
import { Property } from 'src/real-estate/property/entities/property.entity';
import { IncomeType } from './entities/income-type.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { typeormWhereTransformer } from '@alisa-backend/common/transformer/typeorm-where.transformer';
import { TransactionStatus } from '@alisa-backend/common/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Events,
  IncomeAccountingDateChangedEvent,
  StandaloneIncomeCreatedEvent,
  StandaloneIncomeDeletedEvent,
  StandaloneIncomeUpdatedEvent,
} from '@alisa-backend/common/events';
import { DataSaveResultDto } from '@alisa-backend/common/dtos/data-save-result.dto';
import {
  buildBulkOperationResult,
  createSuccessResult,
  createUnauthorizedResult,
  createErrorResult,
} from '@alisa-backend/common/utils/bulk-operation.util';

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
    private eventEmitter: EventEmitter2,
  ) {}

  async search(
    user: JWTUser,
    options: FindManyOptions<Income>,
  ): Promise<Income[]> {
    if (options.where !== undefined) {
      options.where = typeormWhereTransformer(options.where);
    }
    options.where = this.authService.addOwnershipFilter(user, options.where);

    // Ensure transaction relation is loaded to filter by status
    if (!options.relations) {
      options.relations = ['transaction'];
    } else if (Array.isArray(options.relations)) {
      if (!options.relations.includes('transaction')) {
        options.relations = [...options.relations, 'transaction'];
      }
    } else if (typeof options.relations === 'object') {
      // Handle object format: { incomeType: true, property: true }
      options.relations = { ...options.relations, transaction: true };
    }

    const results = await this.repository.find(options);

    // Filter out incomes with pending transactions
    return results.filter(
      (income) =>
        !income.transaction ||
        income.transaction.status === TransactionStatus.ACCEPTED,
    );
  }

  async findOne(
    user: JWTUser,
    id: number,
    options: FindOneOptions<Income> = {},
  ): Promise<Income> {
    options.where = { id: id };

    // Ensure transaction relation is loaded to check status
    if (!options.relations) {
      options.relations = ['transaction'];
    } else if (Array.isArray(options.relations)) {
      if (!options.relations.includes('transaction')) {
        options.relations = [...options.relations, 'transaction'];
      }
    } else if (typeof options.relations === 'object') {
      // Handle object format: { incomeType: true, property: true }
      options.relations = { ...options.relations, transaction: true };
    }

    const income = await this.repository.findOne(options);
    if (!income) {
      return null;
    }

    // Hide incomes with pending transactions
    if (
      income.transaction &&
      income.transaction.status !== TransactionStatus.ACCEPTED
    ) {
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

    const savedIncome = await this.repository.save(incomeEntity);

    // Emit event for standalone income (no transaction)
    if (!savedIncome.transactionId) {
      this.eventEmitter.emit(
        Events.Income.StandaloneCreated,
        new StandaloneIncomeCreatedEvent(savedIncome),
      );
    }

    return savedIncome;
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
      order: { key: 'ASC' },
    });

    const income = new IncomeInputDto();
    income.incomeTypeId = incomeTypes[0].id;
    income.description = '';

    return income;
  }

  async update(
    user: JWTUser,
    id: number,
    input: IncomeInputDto,
  ): Promise<Income> {
    const incomeEntity = await this.getEntityOrThrow(user, id);
    // Capture old values before update for delta calculation
    const oldAccountingDate = incomeEntity.accountingDate;
    const oldTotalAmount = incomeEntity.totalAmount;
    const oldIncomeTypeId = incomeEntity.incomeTypeId;

    this.mapData(incomeEntity, input);
    if (incomeEntity.transaction) {
      incomeEntity.transaction.id = incomeEntity.transactionId;
    }

    await this.repository.save(incomeEntity);

    // Emit event for standalone income (no transaction) - triggers incremental update
    if (!incomeEntity.transactionId) {
      this.eventEmitter.emit(
        Events.Income.StandaloneUpdated,
        new StandaloneIncomeUpdatedEvent(
          incomeEntity,
          oldTotalAmount,
          oldAccountingDate,
          oldIncomeTypeId,
        ),
      );
    } else if (
      // Emit event if accountingDate changed and transaction is accepted
      this.hasAccountingDateChanged(oldAccountingDate, incomeEntity.accountingDate) &&
      incomeEntity.transaction?.status === TransactionStatus.ACCEPTED
    ) {
      this.eventEmitter.emit(
        Events.Income.AccountingDateChanged,
        new IncomeAccountingDateChangedEvent(incomeEntity, oldAccountingDate),
      );
    }

    return incomeEntity;
  }

  private hasAccountingDateChanged(oldDate: Date, newDate: Date): boolean {
    if (!oldDate && !newDate) return false;
    if (!oldDate || !newDate) return true;
    return new Date(oldDate).getTime() !== new Date(newDate).getTime();
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    const income = await this.getEntityOrThrow(user, id);

    // Prevent deletion if income is linked to a transaction
    if (income.transactionId) {
      throw new BadRequestException(
        'Cannot delete income with a transaction relation. Delete the transaction instead.',
      );
    }

    // Store income data before deletion for incremental statistics update
    const deletedIncome = { ...income };

    // Delete the income
    await this.repository.delete(id);

    // Emit event to trigger incremental statistics update
    // Note: Only standalone incomes (transactionId IS NULL) can be deleted - the guard above
    // throws for linked incomes. Standalone incomes need this event because they don't have
    // a transaction that would trigger statistics updates.
    this.eventEmitter.emit(
      Events.Income.StandaloneDeleted,
      new StandaloneIncomeDeletedEvent(deletedIncome as Income),
    );
  }

  async deleteMany(user: JWTUser, ids: number[]): Promise<DataSaveResultDto> {
    if (ids.length === 0) {
      throw new BadRequestException('No ids provided');
    }

    const incomes = await this.repository.find({
      where: { id: In(ids) },
    });

    const deletedIncomes: Income[] = [];

    const deleteTask = incomes.map(async (income) => {
      try {
        if (!(await this.authService.hasOwnership(user, income.propertyId))) {
          return createUnauthorizedResult(income.id);
        }

        // Prevent deletion if income is linked to a transaction
        if (income.transactionId) {
          return {
            id: income.id,
            statusCode: 400,
            message:
              'Cannot delete income with a transaction relation. Delete the transaction instead.',
          };
        }

        // Store income data before deletion for incremental statistics update
        const deletedIncome = { ...income } as Income;

        // Delete the income
        await this.repository.delete(income.id);
        deletedIncomes.push(deletedIncome);

        return createSuccessResult(income.id);
      } catch (e) {
        return createErrorResult(income.id, e);
      }
    });

    const result = await buildBulkOperationResult(deleteTask, incomes.length);

    // Emit events for each deleted income to trigger incremental statistics update
    // Note: deletedIncomes only contains standalone incomes - linked incomes
    // return an error above and are not added to this array
    for (const income of deletedIncomes) {
      this.eventEmitter.emit(
        Events.Income.StandaloneDeleted,
        new StandaloneIncomeDeletedEvent(income),
      );
    }

    return result;
  }

  private mapData(income: Income, input: IncomeInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        income[key] = value;
      }
    });

    if (income.transaction) {
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
