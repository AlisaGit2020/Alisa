import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { JWTUser } from '@asset-backend/auth/types';
import { AuthService } from '@asset-backend/auth/auth.service';
import { PropertyService } from '@asset-backend/real-estate/property/property.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  Events,
  TransactionAcceptedEvent,
  TransactionDeletedEvent,
} from '@asset-backend/common/events';
import { TransactionStatus } from '@asset-backend/common/types';
import { EventTrackerService } from '@asset-backend/common/event-tracker.service';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(Transaction)
    private repository: Repository<Transaction>,

    private authService: AuthService,
    private propertyService: PropertyService,

    private eventEmitter: EventEmitter2,
    private eventTracker: EventTrackerService,
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
    const status = TransactionStatus.ACCEPTED;
    const transactions = await this.repository.find({
      where: { propertyId, status },
      order: { id: 'DESC' },
      take: 1,
    });

    if (transactions.length === 0) {
      return 0;
    }

    return transactions[0].balance;
  }

  @OnEvent(Events.Transaction.Accepted)
  async transactionAccepted(event: TransactionAcceptedEvent): Promise<void> {
    this.eventTracker.increment();
    try {
      const previousBalance = await this.getPreviousBalance(event.transaction);
      event.transaction.balance = previousBalance + event.transaction.amount;
      await this.repository.save(event.transaction);

      this.eventEmitter.emit(Events.Balance.Changed, {
        propertyId: event.transaction.propertyId,
        newBalance: event.transaction.balance,
      });
    } finally {
      this.eventTracker.decrement();
    }
  }

  async recalculateBalancesAfter(transaction: Transaction): Promise<number> {
    const transactions = await this.repository.find({
      where: {
        propertyId: transaction.propertyId,
        status: TransactionStatus.ACCEPTED,
        id: MoreThan(transaction.id),
      },
      order: { id: 'ASC' },
    });

    if (transactions.length === 0) {
      return transaction.balance; //Must be the last transaction
    }

    let balance = transaction.balance;

    for (const t of transactions) {
      balance = t.amount + balance;
      t.balance = balance;
      await this.repository.save(t);
    }

    return balance;
  }

  @OnEvent(Events.Transaction.Deleted)
  async handleTransactionDelete(event: TransactionDeletedEvent) {
    this.eventTracker.increment();
    try {
      const transaction = event.transaction;

      const transactions = await this.repository.find({
        where: {
          propertyId: transaction.propertyId,
          status: TransactionStatus.ACCEPTED,
          id: MoreThan(transaction.id),
        },
        order: { id: 'ASC' },
        take: 1,
      });
      const nextTransaction = transactions[0];

      if (!nextTransaction) {
        this.eventEmitter.emit(Events.Balance.Changed, {
          propertyId: transaction.propertyId,
          newBalance: await this.getPreviousBalance(transaction),
        });
        return;
      }
      //Fix next transaction balance
      nextTransaction.balance = nextTransaction.balance - transaction.amount;
      await this.repository.save(nextTransaction);

      const newBalance = await this.recalculateBalancesAfter(nextTransaction);

      this.eventEmitter.emit(Events.Balance.Changed, {
        propertyId: transaction.propertyId,
        newBalance: newBalance,
      });
    } finally {
      this.eventTracker.decrement();
    }
  }

  private async getPreviousBalance(transaction: Transaction): Promise<number> {
    const previousIds = await this.repository.find({
      where: {
        propertyId: transaction.propertyId,
        status: TransactionStatus.ACCEPTED,
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
