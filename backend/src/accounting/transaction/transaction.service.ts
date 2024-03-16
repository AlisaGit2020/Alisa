import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, LessThan, MoreThan, Repository } from 'typeorm';
import { TransactionInputDto } from './dtos/transaction-input.dto';
import { Transaction } from './entities/transaction.entity';
import { typeormWhereTransformer } from '@alisa-backend/common/transformer/typeorm-where.transformer';
import { TransactionStatisticsDto } from './dtos/transaction-statistics.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private repository: Repository<Transaction>,

    private authService: AuthService,
    private propertyService: PropertyService,
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

    const transactionEntity = new Transaction();
    this.mapData(transactionEntity, input);
    await this.calculateBalanceAddCase(user, transactionEntity);
    return await this.repository.save(transactionEntity);
  }

  async update(
    user: JWTUser,
    id: number,
    input: TransactionInputDto,
  ): Promise<Transaction> {
    await this.getEntityOrThrow(user, id);

    const transactionEntity = await this.findOne(user, id);
    await this.calculateBalanceUpdateCase(user, transactionEntity, input);
    this.mapData(transactionEntity, input);

    await this.repository.save(transactionEntity);
    await this.recalculateBalancesAfter(transactionEntity);

    return transactionEntity;
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
    await this.recalculateBalancesAfterDelete(transaction);
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

    const result = await queryBuilder
      .select('COUNT(transaction.id)', 'rowCount')
      .addSelect(
        'SUM(CASE WHEN transaction.amount < 0 THEN (transaction.amount * -1) ELSE 0 END)',
        'totalExpenses',
      )
      .addSelect(
        'SUM(CASE WHEN transaction.amount > 0 THEN transaction.amount ELSE 0 END)',
        'totalIncomes',
      )
      .addSelect('SUM(transaction.amount)', 'total')
      .leftJoin('transaction.property', 'property')
      .leftJoin('property.ownerships', 'ownership')
      .where(options.where)
      .andWhere('ownership.userId = :userId', { userId: user.id })
      .getRawOne();

    return {
      rowCount: Number(result.rowCount),
      totalExpenses: Number(result.totalExpenses),
      totalIncomes: Number(result.totalIncomes),
      total: Number(result.total),
    };
  }

  async getBalance(user: JWTUser, propertyId: number): Promise<number> {
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException();
    }

    if (!(await this.authService.hasOwnership(user, propertyId))) {
      throw new UnauthorizedException();
    }

    const transactions = await this.search(user, {
      where: { propertyId },
      order: { id: 'DESC' },
      take: 1,
    });

    if (transactions.length === 0) {
      return 0;
    }

    return transactions[0].balance;
  }

  async calculateBalanceAddCase(
    user: JWTUser,
    transaction: Transaction,
  ): Promise<void> {
    const balance = await this.getBalance(user, transaction.propertyId);
    transaction.balance = balance + transaction.amount;
  }

  async calculateBalanceUpdateCase(
    user: JWTUser,
    transaction: Transaction,
    input: TransactionInputDto,
  ): Promise<void> {
    if (input.amount === transaction.amount) {
      return;
    }
    //Get all transaction ids before the current transaction
    const previousIds = await this.repository.find({
      where: {
        propertyId: transaction.propertyId,
        id: LessThan(transaction.id),
      },
      order: { id: 'DESC' },
      select: ['id'],
      take: 1,
    });
    const previousId = previousIds[0]?.id ?? 0;

    if (previousId === 0) {
      transaction.balance = input.amount;
      return;
    }
    //Get previous row balance
    const previousBalance = await this.repository.findOne({
      where: { id: previousId },
      select: ['balance'],
    });
    //Calculate the new balance, previous balance new amount
    transaction.balance = previousBalance.balance + input.amount;
  }

  private async recalculateBalancesAfter(transaction: Transaction) {
    const transactions = await this.repository.find({
      where: {
        propertyId: transaction.propertyId,
        id: MoreThan(transaction.id),
      },
      order: { id: 'ASC' },
    });

    if (transactions.length === 0) {
      return;
    }

    let balance = transaction.balance;

    for (const t of transactions) {
      balance = t.amount + balance;
      t.balance = balance;
      await this.repository.save(t);
    }
  }

  private async recalculateBalancesAfterDelete(transaction: Transaction) {
    const transactions = await this.repository.find({
      where: {
        propertyId: transaction.propertyId,
        id: MoreThan(transaction.id),
      },
      order: { id: 'ASC' },
      take: 1,
    });
    const nextTransaction = transactions[0];

    if (!nextTransaction) {
      return;
    }
    //Fix next transaction balance
    nextTransaction.balance = nextTransaction.balance - transaction.amount;
    await this.repository.save(nextTransaction);

    await this.recalculateBalancesAfter(nextTransaction);
  }

  private mapData(transaction: Transaction, input: TransactionInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        transaction[key] = value;
      }
    });

    if (input.expenses !== undefined) {
      for (const expense of input.expenses) {
        expense.propertyId = transaction.propertyId;
      }
    }
    if (input.incomes !== undefined) {
      for (const income of input.incomes) {
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
}
