import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import {
  Events,
  StandaloneIncomeCreatedEvent,
  StandaloneIncomeDeletedEvent,
  StandaloneIncomeUpdatedEvent,
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@alisa-backend/common/events';
import {
  IncomeTypeKey,
  StatisticKey,
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';
import { EventTrackerService } from '@alisa-backend/common/event-tracker.service';

@Injectable()
export class AirbnbStatisticsService {
  constructor(
    private dataSource: DataSource,
    private eventTracker: EventTrackerService,
  ) {}

  /**
   * Recalculates AIRBNB_VISITS statistics for a property.
   * Counts incomes with the global 'airbnb' income type key.
   * Creates all-time, yearly, and monthly statistics.
   */
  async recalculateAirbnbVisits(propertyId: number): Promise<void> {
    const statisticKey = StatisticKey.AIRBNB_VISITS;
    const acceptedStatus = TransactionStatus.ACCEPTED;

    // Delete existing AIRBNB_VISITS statistics for this property
    await this.dataSource.query(
      `DELETE FROM property_statistics
       WHERE "propertyId" = $1 AND key = $2`,
      [propertyId, statisticKey],
    );

    // All-time aggregation (year IS NULL, month IS NULL)
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         i."propertyId",
         $2,
         NULL,
         NULL,
         COUNT(i.id)::TEXT
       FROM income i
       LEFT JOIN transaction t ON t.id = i."transactionId"
       INNER JOIN income_type it ON it.id = i."incomeTypeId"
       WHERE i."propertyId" = $1
         AND (i."transactionId" IS NULL OR t.status = $3)
         AND it.key = $4
       GROUP BY i."propertyId"
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      [propertyId, statisticKey, acceptedStatus, IncomeTypeKey.AIRBNB],
    );

    // Yearly aggregation
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         i."propertyId",
         $2,
         EXTRACT(YEAR FROM i."accountingDate")::SMALLINT,
         NULL,
         COUNT(i.id)::TEXT
       FROM income i
       LEFT JOIN transaction t ON t.id = i."transactionId"
       INNER JOIN income_type it ON it.id = i."incomeTypeId"
       WHERE i."propertyId" = $1
         AND (i."transactionId" IS NULL OR t.status = $3)
         AND it.key = $4
       GROUP BY i."propertyId", EXTRACT(YEAR FROM i."accountingDate")
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      [propertyId, statisticKey, acceptedStatus, IncomeTypeKey.AIRBNB],
    );

    // Monthly aggregation
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         i."propertyId",
         $2,
         EXTRACT(YEAR FROM i."accountingDate")::SMALLINT,
         EXTRACT(MONTH FROM i."accountingDate")::SMALLINT,
         COUNT(i.id)::TEXT
       FROM income i
       LEFT JOIN transaction t ON t.id = i."transactionId"
       INNER JOIN income_type it ON it.id = i."incomeTypeId"
       WHERE i."propertyId" = $1
         AND (i."transactionId" IS NULL OR t.status = $3)
         AND it.key = $4
       GROUP BY i."propertyId", EXTRACT(YEAR FROM i."accountingDate"), EXTRACT(MONTH FROM i."accountingDate")
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      [propertyId, statisticKey, acceptedStatus, IncomeTypeKey.AIRBNB],
    );
  }

  @OnEvent(Events.Income.StandaloneCreated)
  async handleStandaloneIncomeCreated(
    event: StandaloneIncomeCreatedEvent,
  ): Promise<void> {
    const { income } = event;
    // Only process airbnb income types
    if (income.incomeType?.key !== IncomeTypeKey.AIRBNB) {
      return;
    }

    this.eventTracker.increment();
    try {
      await this.upsertAirbnbVisits(income.propertyId, income.accountingDate, 1);
    } finally {
      this.eventTracker.decrement();
    }
  }

  @OnEvent(Events.Income.StandaloneUpdated)
  async handleStandaloneIncomeUpdated(
    event: StandaloneIncomeUpdatedEvent,
  ): Promise<void> {
    // For updates, we need to check if income type changed to/from airbnb
    // For simplicity, just recalculate when airbnb is involved
    const { income, oldIncomeTypeId } = event;
    const isNewAirbnb = income.incomeType?.key === IncomeTypeKey.AIRBNB;
    // We don't have old income type key, so just recalculate if current is airbnb
    // or if incomeTypeId changed
    if (isNewAirbnb || income.incomeTypeId !== oldIncomeTypeId) {
      this.eventTracker.increment();
      try {
        await this.recalculateAirbnbVisits(income.propertyId);
      } finally {
        this.eventTracker.decrement();
      }
    }
  }

  @OnEvent(Events.Income.StandaloneDeleted)
  async handleStandaloneIncomeDeleted(
    event: StandaloneIncomeDeletedEvent,
  ): Promise<void> {
    const { income } = event;
    // Only process airbnb income types
    if (income.incomeType?.key !== IncomeTypeKey.AIRBNB) {
      return;
    }

    this.eventTracker.increment();
    try {
      await this.upsertAirbnbVisits(income.propertyId, income.accountingDate, -1);
    } finally {
      this.eventTracker.decrement();
    }
  }

  @OnEvent(Events.Transaction.Accepted)
  async handleTransactionAccepted(
    event: TransactionCreatedEvent,
  ): Promise<void> {
    if (event.transaction.type !== TransactionType.INCOME) {
      return;
    }

    this.eventTracker.increment();
    try {
      await this.recalculateAirbnbVisits(event.transaction.propertyId);
    } finally {
      this.eventTracker.decrement();
    }
  }

  @OnEvent(Events.Transaction.Deleted)
  async handleTransactionDeleted(
    event: TransactionDeletedEvent,
  ): Promise<void> {
    if (event.transaction.type !== TransactionType.INCOME) {
      return;
    }

    this.eventTracker.increment();
    try {
      await this.recalculateAirbnbVisits(event.transaction.propertyId);
    } finally {
      this.eventTracker.decrement();
    }
  }

  private async upsertAirbnbVisits(
    propertyId: number,
    accountingDate: Date,
    delta: number,
  ): Promise<void> {
    const statisticKey = StatisticKey.AIRBNB_VISITS;
    const year = accountingDate ? new Date(accountingDate).getFullYear() : null;
    const month = accountingDate ? new Date(accountingDate).getMonth() + 1 : null;

    // Upsert all-time
    await this.upsertStatistic(propertyId, statisticKey, null, null, delta);
    // Upsert yearly
    await this.upsertStatistic(propertyId, statisticKey, year, null, delta);
    // Upsert monthly
    await this.upsertStatistic(propertyId, statisticKey, year, month, delta);
  }

  private async upsertStatistic(
    propertyId: number,
    key: string,
    year: number | null,
    month: number | null,
    delta: number,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = (CAST(property_statistics."value" AS INTEGER) + $6)::TEXT`,
      [propertyId, key, year, month, delta.toString(), delta],
    );
  }
}
