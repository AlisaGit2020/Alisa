import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { TransactionInputDto } from './dtos/transaction-input.dto';
import { Transaction } from './entities/transaction.entity';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Events, TransactionCreatedEvent } from '@alisa-backend/common/events';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(Transaction)
    private repository: Repository<Transaction>,

    private authService: AuthService,
    private propertyService: PropertyService,

    private eventEmitter: EventEmitter2,
  ) {}

  async getBalance(user: JWTUser, propertyId: number): Promise<number> {
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException();
    }

    if (!(await this.authService.hasOwnership(user, propertyId))) {
      throw new UnauthorizedException();
    }

    return this._getBalance(propertyId);
  }

  private async _getBalance(propertyId: number): Promise<number> {
    const transactions = await this.repository.find({
      where: { propertyId },
      order: { id: 'DESC' },
      take: 1,
    });

    if (transactions.length === 0) {
      return 0;
    }

    return transactions[0].balance;
  }

  @OnEvent(Events.Transaction.Created)
  async handleTransactionCreated(
    event: TransactionCreatedEvent,
  ): Promise<void> {
    const previousBalance = await this.getPreviousBalance(event.transaction);
    event.transaction.balance = previousBalance + event.transaction.amount;
    await this.repository.save(event.transaction);

    this.eventEmitter.emit(Events.Balance.Changed, {
      propertyId: event.transaction.propertyId,
      newBalance: event.transaction.balance,
    });
  }

  async handleTransactionUpdate(
    transaction: Transaction,
    input: TransactionInputDto,
  ): Promise<void> {
    if (Number(input.amount) === transaction.amount) {
      return;
    }
    const previousBalance = await this.getPreviousBalance(transaction);
    //Calculate the new balance, previous balance new amount
    transaction.balance = previousBalance + Number(input.amount);
  }

  async recalculateBalancesAfter(transaction: Transaction) {
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

    this.eventEmitter.emit(Events.Balance.Changed, {
      propertyId: transaction.propertyId,
      newBalance: balance,
    });
  }

  async recalculateBalancesAfterDelete(transaction: Transaction) {
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

  private async getPreviousBalance(transaction: Transaction): Promise<number> {
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
      return 0;
    }

    const previousBalance = await this.repository.findOne({
      where: { id: previousId },
      select: ['balance'],
    });

    return previousBalance.balance;
  }
}
