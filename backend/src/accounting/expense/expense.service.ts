import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, In, Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseInputDto } from './dtos/expense-input.dto';
import { ExpenseType } from './entities/expense-type.entity';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { typeormWhereTransformer } from '@alisa-backend/common/transformer/typeorm-where.transformer';
import { DepreciationService } from '@alisa-backend/accounting/depreciation/depreciation.service';
import { TransactionStatus } from '@alisa-backend/common/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Events, ExpenseAccountingDateChangedEvent } from '@alisa-backend/common/events';
import {
  DataSaveResultDto,
  DataSaveResultRowDto,
} from '@alisa-backend/common/dtos/data-save-result.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private repository: Repository<Expense>,
    @InjectRepository(ExpenseType)
    private expenseTypeRepository: Repository<ExpenseType>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private authService: AuthService,
    private depreciationService: DepreciationService,
    private eventEmitter: EventEmitter2,
  ) {}

  async search(
    user: JWTUser,
    options: FindManyOptions<Expense>,
  ): Promise<Expense[]> {
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
      // Handle object format: { expenseType: true, property: true }
      options.relations = { ...options.relations, transaction: true };
    }

    const results = await this.repository.find(options);

    // Filter out expenses with pending transactions
    return results.filter(
      (expense) =>
        !expense.transaction ||
        expense.transaction.status === TransactionStatus.ACCEPTED,
    );
  }

  async findOne(
    user: JWTUser,
    id: number,
    options: FindOneOptions<Expense> = {},
  ): Promise<Expense> {
    options.where = { id: id };

    // Ensure transaction relation is loaded to check status
    if (!options.relations) {
      options.relations = ['transaction'];
    } else if (Array.isArray(options.relations)) {
      if (!options.relations.includes('transaction')) {
        options.relations = [...options.relations, 'transaction'];
      }
    } else if (typeof options.relations === 'object') {
      // Handle object format: { expenseType: true, property: true }
      options.relations = { ...options.relations, transaction: true };
    }

    const expense = await this.repository.findOne(options);
    if (!expense) {
      return null;
    }

    // Hide expenses with pending transactions
    if (
      expense.transaction &&
      expense.transaction.status !== TransactionStatus.ACCEPTED
    ) {
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

    this.mapData(user, expenseEntity, input);

    const savedExpense = await this.repository.save(expenseEntity);

    // Create depreciation asset if this is a capital improvement
    await this.handleDepreciationAsset(savedExpense);

    return savedExpense;
  }

  async save(user: JWTUser, input: ExpenseInputDto): Promise<Expense> {
    if (input.id > 0) {
      return this.update(user, input.id, input);
    } else {
      return this.add(user, input);
    }
  }
  async getDefault(): Promise<ExpenseInputDto> {
    const expenseTypes = await this.expenseTypeRepository.find({
      take: 1,
      order: { name: 'ASC' },
    });

    const expense = new ExpenseInputDto();
    expense.expenseTypeId = expenseTypes[0].id;
    expense.description = expenseTypes[0].name;

    return expense;
  }

  async update(
    user: JWTUser,
    id: number,
    input: ExpenseInputDto,
  ): Promise<Expense> {
    const expenseEntity = await this.getEntityOrThrow(user, id);
    const oldAccountingDate = expenseEntity.accountingDate;

    this.mapData(user, expenseEntity, input);
    if (expenseEntity.transaction) {
      expenseEntity.transaction.id = expenseEntity.transactionId;
    }

    await this.repository.save(expenseEntity);

    // Emit event if accountingDate changed and transaction is accepted
    if (
      this.hasAccountingDateChanged(oldAccountingDate, expenseEntity.accountingDate) &&
      expenseEntity.transaction?.status === TransactionStatus.ACCEPTED
    ) {
      this.eventEmitter.emit(
        Events.Expense.AccountingDateChanged,
        new ExpenseAccountingDateChangedEvent(expenseEntity, oldAccountingDate),
      );
    }

    // Update or create depreciation asset if applicable
    await this.handleDepreciationAsset(expenseEntity);

    return expenseEntity;
  }

  private hasAccountingDateChanged(oldDate: Date, newDate: Date): boolean {
    if (!oldDate && !newDate) return false;
    if (!oldDate || !newDate) return true;
    return new Date(oldDate).getTime() !== new Date(newDate).getTime();
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    const expense = await this.getEntityOrThrow(user, id);
    const transactionId = expense.transactionId;

    // Delete associated depreciation asset
    await this.depreciationService.deleteByExpenseId(id);

    // Delete the expense
    await this.repository.delete(id);

    // Delete associated transaction if it exists
    if (transactionId) {
      await this.transactionRepository.delete(transactionId);
    }
  }

  async deleteMany(user: JWTUser, ids: number[]): Promise<DataSaveResultDto> {
    if (ids.length === 0) {
      throw new BadRequestException('No ids provided');
    }

    const expenses = await this.repository.find({
      where: { id: In(ids) },
    });

    const deleteTask = expenses.map(async (expense) => {
      try {
        if (!(await this.authService.hasOwnership(user, expense.propertyId))) {
          return {
            id: expense.id,
            statusCode: 401,
            message: 'Unauthorized',
          } as DataSaveResultRowDto;
        }

        // Delete associated depreciation asset
        await this.depreciationService.deleteByExpenseId(expense.id);

        // Delete the expense
        await this.repository.delete(expense.id);

        // Delete associated transaction if it exists
        if (expense.transactionId) {
          await this.transactionRepository.delete(expense.transactionId);
        }

        return {
          id: expense.id,
          statusCode: 200,
          message: 'OK',
        } as DataSaveResultRowDto;
      } catch (e) {
        return {
          id: expense.id,
          statusCode: e.status || 500,
          message: e.message,
        } as DataSaveResultRowDto;
      }
    });

    return this.getSaveTaskResult(deleteTask, expenses);
  }

  private async getSaveTaskResult(
    tasks: Promise<DataSaveResultRowDto>[],
    items: Expense[],
  ): Promise<DataSaveResultDto> {
    const results = await Promise.all(tasks);
    const successCount = results.filter((r) => r.statusCode === 200).length;
    const failedCount = results.filter((r) => r.statusCode !== 200).length;

    return {
      rows: {
        total: items.length,
        success: successCount,
        failed: failedCount,
      },
      allSuccess: failedCount === 0,
      results,
    };
  }

  private async handleDepreciationAsset(expense: Expense): Promise<void> {
    // Get the expense type to check if it's a capital improvement
    const expenseType = await this.expenseTypeRepository.findOne({
      where: { id: expense.expenseTypeId },
    });

    if (!expenseType) {
      return;
    }

    if (expenseType.isCapitalImprovement) {
      // Check if asset already exists
      const existingAsset = await this.depreciationService.getByExpenseId(expense.id);
      if (existingAsset) {
        // Update existing asset
        await this.depreciationService.updateFromExpense(expense);
      } else {
        // Create new depreciation asset
        await this.depreciationService.createFromExpense(expense);
      }
    } else {
      // If expense type changed from capital improvement to regular, delete the asset
      await this.depreciationService.deleteByExpenseId(expense.id);
    }
  }

  private mapData(user, expense: Expense, input: ExpenseInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        expense[key] = value;
      }
    });

    if (expense.transaction) {
      expense.transaction.propertyId = expense.propertyId;
      expense.transaction.property = expense.property;
      // Copy accountingDate from transaction if not explicitly set
      if (!expense.accountingDate && expense.transaction.accountingDate) {
        expense.accountingDate = expense.transaction.accountingDate;
      }
    }
    if (expense.expenseType) {
      expense.expenseType.userId = user.id;
    }
  }

  private async getEntityOrThrow(user: JWTUser, id: number): Promise<Expense> {
    const expenseEntity = await this.findOne(user, id);
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
