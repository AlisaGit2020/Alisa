import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Repository } from 'typeorm';
import { TransactionInputDto } from './dtos/transaction-input.dto';
import { Transaction } from './entities/transaction.entity';
import { typeormWhereTransformer } from '@alisa-backend/common/transformer/typeorm-where.transformer';
import { TransactionStatisticsDto } from './dtos/transaction-statistics.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Events,
  TransactionAcceptedEvent,
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@alisa-backend/common/events';
import {
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';
import {
  DataSaveResultDto,
  DataSaveResultRowDto,
} from '@alisa-backend/common/dtos/data-save-result.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private repository: Repository<Transaction>,

    private authService: AuthService,
    private eventEmitter: EventEmitter2,
  ) {}

  async search(
    user: JWTUser,
    options: FindManyOptions<Transaction>,
  ): Promise<Transaction[]> {
    if (options.where !== undefined) {
      options.where = typeormWhereTransformer(options.where);
    }
    options.where = this.authService.addOwnershipFilter(user, options.where);
    return this.repository.find(options);
  }

  async findOne(user: JWTUser, id: number): Promise<Transaction> {
    const transaction = await this.repository.findOneBy({ id: id });

    if (!transaction) {
      return null;
    }

    if (!(await this.authService.hasOwnership(user, transaction.propertyId))) {
      throw new UnauthorizedException();
    }

    return transaction;
  }

  async add(user: JWTUser, input: TransactionInputDto): Promise<Transaction> {
    const hasOwnership = await this.authService.hasOwnership(
      user,
      input.propertyId,
    );
    if (!hasOwnership) {
      throw new UnauthorizedException();
    }

    await this.validatePostInputOrThrow(input);

    const transactionEntity = new Transaction();
    this.mapData(transactionEntity, input);

    const transaction = await this.repository.save(transactionEntity);

    this.eventEmitter.emit(
      Events.Transaction.Created,
      new TransactionCreatedEvent(transaction),
    );

    if (transaction.status === TransactionStatus.ACCEPTED) {
      this.eventEmitter.emit(
        Events.Transaction.Accepted,
        new TransactionAcceptedEvent(transaction),
      );
    }

    return transaction;
  }

  /**
    status PENDING
      - update allowed
      - type is allowed to be unknown

    status ACCEPTED
       - update not allowed
       - type cannot be unknown
   */
  async update(
    user: JWTUser,
    id: number,
    input: TransactionInputDto,
  ): Promise<Transaction> {
    await this.getEntityOrThrow(user, id);
    await this.validatePutInputOrThrow(input);

    const oldTransaction = await this.findOne(user, id);

    if (oldTransaction.status === TransactionStatus.ACCEPTED) {
      throw new BadRequestException('Cannot update accepted transactions');
    }

    const transaction = await this.findOne(user, id);

    this.mapData(transaction, input);

    const updatedTransaction = await this.repository.save(transaction);
    if (
      oldTransaction.status === TransactionStatus.PENDING &&
      updatedTransaction.status === TransactionStatus.ACCEPTED
    ) {
      this.eventEmitter.emit(
        Events.Transaction.Accepted,
        new TransactionAcceptedEvent(updatedTransaction),
      );
    }

    return updatedTransaction;
  }

  async save(user: JWTUser, input: TransactionInputDto): Promise<Transaction> {
    if (input.id > 0) {
      return this.update(user, input.id, input);
    } else {
      return this.add(user, input);
    }
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    const transaction = await this.getEntityOrThrow(user, id);
    await this.repository.delete(id);
    this.eventEmitter.emit(
      Events.Transaction.Deleted,
      new TransactionDeletedEvent(transaction),
    );
  }

  async accept(jwtUser: JWTUser, ids: number[]) {
    if (ids.length === 0) {
      throw new BadRequestException('No ids provided');
    }

    const transactions = await this.repository.find({
      where: { id: In(ids) },
    });

    //Update all transactions simultaneously and gather all promises
    const saveTask = transactions.map(async (transaction) => {
      transaction.status = TransactionStatus.ACCEPTED;
      if (transaction.type === TransactionType.UNKNOWN) {
        return {
          id: transaction.id,
          statusCode: 400,
          message: 'Type cannot be unknown for accepted transactions',
        } as DataSaveResultRowDto;
      }
      return this.executeUpdateTask(jwtUser, transaction);
    });

    return this.getSaveTaskResult(saveTask, transactions);
  }

  async setType(jwtUser: JWTUser, ids: number[], type: TransactionType) {
    if (ids.length === 0) {
      throw new BadRequestException('No ids provided');
    }

    //Check if type is one of the allowed types
    if (
      type !== TransactionType.UNKNOWN &&
      type !== TransactionType.EXPENSE &&
      type !== TransactionType.INCOME &&
      type !== TransactionType.WITHDRAW &&
      type !== TransactionType.DEPOSIT
    ) {
      throw new BadRequestException('Invalid type');
    }

    const transactions = await this.repository.find({
      where: { id: In(ids) },
    });

    //Update all transactions simultaneously and gather all promises
    const saveTask = transactions.map(async (transaction) => {
      transaction.type = type;
      return this.executeUpdateTask(jwtUser, transaction);
    });

    return this.getSaveTaskResult(saveTask, transactions);
  }

  async statistics(
    user: JWTUser,
    options: FindManyOptions<Transaction>,
  ): Promise<TransactionStatisticsDto> {
    const queryBuilder = this.repository.createQueryBuilder('transaction');

    if (options.where === undefined) {
      options.where = {};
    } else {
      options.where = typeormWhereTransformer(options.where);
    }

    options.where.status = TransactionStatus.ACCEPTED;

    const result = await queryBuilder
      .select('COUNT(transaction.id)', 'rowCount')
      .addSelect(
        `SUM(CASE WHEN transaction.type = ${TransactionType.EXPENSE} THEN (transaction.amount * -1) ELSE 0 END)`,
        'totalExpenses',
      )
      .addSelect(
        `SUM(CASE WHEN transaction.type = ${TransactionType.INCOME} THEN transaction.amount ELSE 0 END)`,
        'totalIncomes',
      )
      .addSelect('SUM(transaction.amount)', 'total')

      .leftJoin('transaction.property', 'property')
      .leftJoin('property.ownerships', 'ownership')
      .where(options.where)
      .andWhere('ownership.userId = :userId', { userId: user.id })
      .getRawOne();

    const lastTransaction = await this.repository
      .createQueryBuilder('transaction')
      .select('transaction.balance', 'balance')
      .leftJoin('transaction.property', 'property')
      .leftJoin('property.ownerships', 'ownership')
      .where(options.where)
      .andWhere('ownership.userId = :userId', { userId: user.id })
      .orderBy('transaction.id', 'DESC')
      .limit(1)
      .getRawOne();

    if (lastTransaction === undefined) {
      result.balance = 0;
    } else {
      result.balance = lastTransaction.balance;
    }

    return {
      rowCount: Number(result.rowCount),
      balance: Number(result.balance),
      totalExpenses: Number(result.totalExpenses),
      totalIncomes: Number(result.totalIncomes),
      total: Number(result.total),
    };
  }

  private mapData(transaction: Transaction, input: TransactionInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        transaction[key] = value;
      }
    });

    if (
      input.type === TransactionType.EXPENSE ||
      input.type === TransactionType.WITHDRAW
    ) {
      if (transaction.amount > 0) {
        transaction.amount = -transaction.amount;
      }
    }

    if (input.expenses !== undefined) {
      for (const expense of input.expenses) {
        expense.transactionId = transaction.id;
        expense.propertyId = transaction.propertyId;
      }
    }
    if (input.incomes !== undefined) {
      for (const income of input.incomes) {
        income.transactionId = transaction.id;
        income.propertyId = transaction.propertyId;
      }
    }
  }

  private async getEntityOrThrow(
    user: JWTUser,
    id: number,
  ): Promise<Transaction> {
    const entity = await this.findOne(user, id);
    if (!entity) {
      throw new NotFoundException();
    }
    if (!(await this.authService.hasOwnership(user, entity.propertyId))) {
      throw new UnauthorizedException();
    }
    return entity;
  }

  private async validatePostInputOrThrow(input: TransactionInputDto) {
    if (
      input.status === TransactionStatus.ACCEPTED &&
      input.type === TransactionType.UNKNOWN
    ) {
      throw new BadRequestException(
        'Type cannot be unknown for accepted transactions',
      );
    }
    await this.commonValidation(input);
  }

  private async validatePutInputOrThrow(input: TransactionInputDto) {
    await this.commonValidation(input);
  }

  private async commonValidation(input: TransactionInputDto): Promise<void> {
    if (input.type === TransactionType.EXPENSE && input?.incomes?.length > 0) {
      throw new BadRequestException('Incomes are not allowed for expenses');
    }

    if (input.type === TransactionType.INCOME && input?.expenses?.length > 0) {
      throw new BadRequestException('Expenses are not allowed for incomes');
    }

    if (
      input.type === TransactionType.DEPOSIT &&
      (input.expenses || input.incomes)
    ) {
      throw new BadRequestException(
        'Expenses or incomes are not allowed for deposits',
      );
    }

    if (
      input.type === TransactionType.WITHDRAW &&
      (input.expenses || input.incomes)
    ) {
      throw new BadRequestException(
        'Expenses or incomes are not allowed for withdraws',
      );
    }

    //If accept the transaction, type cannot be unknown
    if (input.status === TransactionStatus.ACCEPTED) {
      if (input.type === TransactionType.UNKNOWN) {
        throw new BadRequestException(
          'Type cannot be unknown for accepted transactions',
        );
      }
    }
  }

  private async executeUpdateTask(jwtUser: JWTUser, transaction: Transaction) {
    try {
      await this.update(jwtUser, transaction.id, transaction);
      return {
        id: transaction.id,
        statusCode: 200,
        message: 'OK',
      } as DataSaveResultRowDto;
    } catch (e) {
      return {
        id: transaction.id,
        statusCode: e.status,
        message: e.message,
      } as DataSaveResultRowDto;
    }
  }

  private async getSaveTaskResult(
    saveTask: Promise<DataSaveResultRowDto>[],
    transactions: Transaction[],
  ) {
    const results = await Promise.all(saveTask);

    const result = new DataSaveResultDto();
    result.rows.total = transactions.length;
    result.rows.success = results.filter((r) => r.statusCode === 200).length;
    result.rows.failed = results.filter((r) => r.statusCode !== 200).length;
    result.allSuccess = result.rows.failed === 0;
    result.results = results;
    return result;
  }
}
