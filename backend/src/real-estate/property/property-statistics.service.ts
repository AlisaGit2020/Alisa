import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, IsNull, Repository } from 'typeorm';
import { PropertyStatistics } from '@alisa-backend/real-estate/property/entities/property-statistics.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { Events, TransactionCreatedEvent } from '@alisa-backend/common/events';
import { StatisticKey } from '@alisa-backend/common/types';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { JWTUser } from '@alisa-backend/auth/types';

@Injectable()
export class PropertyStatisticsService {
  constructor(
    @InjectRepository(PropertyStatistics)
    private repository: Repository<PropertyStatistics>,
  ) {}

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
    options: FindManyOptions<PropertyStatistics>,
  ): Promise<PropertyStatistics[]> {
    return this.repository.find(options);
  }

  @OnEvent(Events.Transaction.Created)
  async calculateStatistics(event: TransactionCreatedEvent): Promise<void> {
    await this.handleAllTime(StatisticKey.BALANCE, event.transaction);
    await this.handleYearly(StatisticKey.BALANCE, event.transaction);
    await this.handleMonthly(StatisticKey.BALANCE, event.transaction);
  }

  private async handleAllTime(
    key: string,
    transaction: Transaction,
  ): Promise<void> {
    let statistics: PropertyStatistics;

    statistics = await this.repository.findOne({
      where: {
        propertyId: transaction.propertyId,
        key,
        year: IsNull(),
        month: IsNull(),
      },
    });

    let value = transaction.amount;
    if (statistics) {
      value = parseFloat(statistics.value) + transaction.amount;
    } else {
      statistics = new PropertyStatistics();
      statistics.propertyId = transaction.propertyId;
      statistics.key = key;
    }

    statistics.value = this.getStatisticValue(value, key);

    await this.repository.save(statistics);
  }

  private async handleYearly(
    key: string,
    transaction: Transaction,
  ): Promise<void> {
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

    let value = transaction.amount;
    if (statistics) {
      value = parseFloat(statistics.value) + transaction.amount;
    } else {
      statistics = new PropertyStatistics();
      statistics.propertyId = transaction.propertyId;
      statistics.key = key;
      statistics.year = year;
    }

    statistics.value = this.getStatisticValue(value, key);

    await this.repository.save(statistics);
  }

  private async handleMonthly(
    key: string,
    transaction: Transaction,
  ): Promise<void> {
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

    let value = transaction.amount;
    if (statistics) {
      value = parseFloat(statistics.value) + transaction.amount;
    } else {
      statistics = new PropertyStatistics();
      statistics.propertyId = transaction.propertyId;
      statistics.key = key;
      statistics.year = year;
      statistics.month = month;
    }

    statistics.value = this.getStatisticValue(value, key);

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

  private getStatisticValue(value: number, key: string): string {
    // set value with correct amount of decimals
    return value.toFixed(this.decimals.get(key));
  }
}
