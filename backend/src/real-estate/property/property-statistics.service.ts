import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, IsNull, Repository } from 'typeorm';
import { PropertyStatistics } from '@alisa-backend/real-estate/property/entities/property-statistics.entity';
import { OnEvent } from '@nestjs/event-emitter';
import {
  Events,
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@alisa-backend/common/events';
import {
  StatisticKey,
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { JWTUser } from '@alisa-backend/auth/types';
import { PropertyStatisticsFilterDto } from '@alisa-backend/real-estate/property/dtos/property-statistics-filter.dto';

@Injectable()
export class PropertyStatisticsService {
  constructor(
    @InjectRepository(PropertyStatistics)
    private repository: Repository<PropertyStatistics>,
  ) {}
  EventCases = {
    CREATED: 'CREATED',
    DELETED: 'DELETED',
  };

  private statisticTypes = [
    StatisticKey.BALANCE,
    StatisticKey.INCOME,
    StatisticKey.EXPENSE,
    StatisticKey.DEPOSIT,
    StatisticKey.WITHDRAW,
  ];

  private decimals = new Map<string, number>([
    [StatisticKey.BALANCE, 2],
    [StatisticKey.INCOME, 2],
    [StatisticKey.EXPENSE, 2],
    [StatisticKey.DEPOSIT, 2],
    [StatisticKey.WITHDRAW, 2],
  ]);

  //Define relevance transaction date field for statistics keys
  private relevanceDateField = new Map<string, string>([
    [StatisticKey.BALANCE, 'transactionDate'],
    [StatisticKey.INCOME, 'accountingDate'],
    [StatisticKey.EXPENSE, 'accountingDate'],
    [StatisticKey.DEPOSIT, 'accountingDate'],
    [StatisticKey.WITHDRAW, 'accountingDate'],
  ]);

  async search(
    user: JWTUser,
    filter: PropertyStatisticsFilterDto,
  ): Promise<PropertyStatistics[]> {
    const options: FindManyOptions<PropertyStatistics> = {
      where: {
        propertyId: filter.propertyId,
        key: filter.key,
        year: filter.year ? filter.year : IsNull(),
        month: filter.month ? filter.month : IsNull(),
      },
    };
    const statistics = await this.repository.find(options);
    if (statistics.length > 0) {
      return statistics;
    }

    if (!filter.key) {
      return [];
    }

    return [
      {
        propertyId: filter.propertyId,
        key: filter.key,
        year: filter.year,
        month: filter.month,
        value: this.getFormattedValue(0, filter.key),
      } as PropertyStatistics,
    ];
  }

  @OnEvent(Events.Transaction.Accepted)
  async handleTransactionCreated(
    event: TransactionCreatedEvent,
  ): Promise<void> {
    const eCase = this.EventCases.CREATED;
    for (const key of this.statisticTypes) {
      await this.transactionAcceptedAllTime(eCase, key, event.transaction);
      await this.transactionAcceptedYearly(eCase, key, event.transaction);
      await this.transactionAcceptedMonthly(eCase, key, event.transaction);
    }
  }

  @OnEvent(Events.Transaction.Deleted)
  async handleTransactionDeleted(
    event: TransactionDeletedEvent,
  ): Promise<void> {
    const eCase = this.EventCases.DELETED;
    for (const key of this.statisticTypes) {
      await this.transactionAcceptedAllTime(eCase, key, event.transaction);
      await this.transactionAcceptedYearly(eCase, key, event.transaction);
      await this.transactionAcceptedMonthly(eCase, key, event.transaction);
    }
  }

  private async transactionAcceptedAllTime(
    eventCase: string,
    key: StatisticKey,
    transaction: Transaction,
  ): Promise<void> {
    if (!this.weInterestedIn(key, transaction)) {
      return;
    }
    let statistics: PropertyStatistics;
    if (transaction === undefined) {
      console.log('transaction is undefined');
    }
    statistics = await this.repository.findOne({
      where: {
        propertyId: transaction.propertyId,
        key,
        year: IsNull(),
        month: IsNull(),
      },
    });

    let value: number;
    if (statistics) {
      value = this.getEventNewValue(eventCase, key, transaction, statistics);
    } else {
      statistics = new PropertyStatistics();
      statistics.propertyId = transaction.propertyId;
      statistics.key = key;
      value = this.getEventNewValue(eventCase, key, transaction);
    }

    statistics.value = this.getFormattedValue(value, key);

    await this.repository.save(statistics);
  }

  private async transactionAcceptedYearly(
    eventCase: string,
    key: StatisticKey,
    transaction: Transaction,
  ): Promise<void> {
    if (!this.weInterestedIn(key, transaction)) {
      return;
    }
    let statistics: PropertyStatistics;

    const year = this.getYear(key, transaction);

    statistics = await this.repository.findOne({
      where: {
        propertyId: transaction.propertyId,
        key,
        year: year,
        month: IsNull(),
      },
    });

    let value: number;
    if (statistics) {
      value = this.getEventNewValue(eventCase, key, transaction, statistics);
    } else {
      statistics = new PropertyStatistics();
      statistics.propertyId = transaction.propertyId;
      statistics.key = key;
      statistics.year = year;
      value = this.getEventNewValue(eventCase, key, transaction);
    }

    statistics.value = this.getFormattedValue(value, key);

    await this.repository.save(statistics);
  }

  private async transactionAcceptedMonthly(
    eventCase: string,
    key: StatisticKey,
    transaction: Transaction,
  ): Promise<void> {
    if (!this.weInterestedIn(key, transaction)) {
      return;
    }
    let statistics: PropertyStatistics;

    const month = this.getMonth(key, transaction);
    const year = this.getYear(key, transaction);

    statistics = await this.repository.findOne({
      where: {
        propertyId: transaction.propertyId,
        key,
        year: year,
        month: month,
      },
    });

    let value: number;
    if (statistics) {
      value = this.getEventNewValue(eventCase, key, transaction, statistics);
    } else {
      statistics = new PropertyStatistics();
      statistics.propertyId = transaction.propertyId;
      statistics.key = key;
      statistics.year = year;
      statistics.month = month;
      value = this.getEventNewValue(eventCase, key, transaction);
    }

    statistics.value = this.getFormattedValue(value, key);

    await this.repository.save(statistics);
  }

  private getYear(key: string, transaction: Transaction): number {
    return new Date(
      transaction[this.relevanceDateField.get(key)],
    ).getFullYear();
  }

  private getMonth(key: string, transaction: Transaction): number {
    return (
      new Date(transaction[this.relevanceDateField.get(key)]).getMonth() + 1
    );
  }

  private getEventNewValue(
    eventCase: string,
    key: StatisticKey,
    transaction: Transaction,
    statistics?: PropertyStatistics,
  ): number {
    let amount = transaction.amount;
    if (key === StatisticKey.EXPENSE || key === StatisticKey.WITHDRAW) {
      amount = -transaction.amount;
    }
    if (statistics) {
      if (eventCase === this.EventCases.CREATED) {
        return parseFloat(statistics.value) + amount;
      } else {
        return parseFloat(statistics.value) - amount;
      }
    }
    return amount;
  }

  private getFormattedValue(value: number, key: string): string {
    // set value with correct amount of decimals
    return value.toFixed(this.decimals.get(key));
  }

  private weInterestedIn(key: string, transaction: Transaction): boolean {
    if (transaction.status !== TransactionStatus.ACCEPTED) {
      return false;
    }

    if (key === StatisticKey.BALANCE) {
      return true;
    }

    if (
      key === StatisticKey.INCOME &&
      transaction.type === TransactionType.INCOME
    ) {
      return true;
    }

    if (
      key === StatisticKey.EXPENSE &&
      transaction.type === TransactionType.EXPENSE
    ) {
      return true;
    }

    if (
      key === StatisticKey.DEPOSIT &&
      transaction.type === TransactionType.DEPOSIT
    ) {
      return true;
    }

    return (
      key === StatisticKey.WITHDRAW &&
      transaction.type === TransactionType.WITHDRAW
    );
  }
}
