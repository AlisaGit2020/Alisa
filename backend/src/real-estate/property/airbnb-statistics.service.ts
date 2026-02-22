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
    this.eventTracker.increment();
    try {
      await this.recalculateAirbnbVisits(event.income.propertyId);
    } finally {
      this.eventTracker.decrement();
    }
  }

  @OnEvent(Events.Income.StandaloneUpdated)
  async handleStandaloneIncomeUpdated(
    event: StandaloneIncomeUpdatedEvent,
  ): Promise<void> {
    this.eventTracker.increment();
    try {
      await this.recalculateAirbnbVisits(event.income.propertyId);
    } finally {
      this.eventTracker.decrement();
    }
  }

  @OnEvent(Events.Income.StandaloneDeleted)
  async handleStandaloneIncomeDeleted(
    event: StandaloneIncomeDeletedEvent,
  ): Promise<void> {
    this.eventTracker.increment();
    try {
      await this.recalculateAirbnbVisits(event.propertyId);
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
}
