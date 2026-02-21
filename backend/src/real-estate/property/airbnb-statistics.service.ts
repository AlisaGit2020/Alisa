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
  UserAirbnbIncomeTypeChangedEvent,
} from '@alisa-backend/common/events';
import { StatisticKey, TransactionStatus, TransactionType } from '@alisa-backend/common/types';
import { EventTrackerService } from '@alisa-backend/common/event-tracker.service';

@Injectable()
export class AirbnbStatisticsService {
  constructor(
    private dataSource: DataSource,
    private eventTracker: EventTrackerService,
  ) {}

  /**
   * Recalculates AIRBNB_VISITS statistics for a property.
   * Counts incomes matching the property owner's airbnbIncomeTypeId setting.
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
    // Use COUNT(DISTINCT i.id) to avoid multiplying counts when property has multiple owners
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         i."propertyId",
         $2,
         NULL,
         NULL,
         COUNT(DISTINCT i.id)::TEXT
       FROM income i
       LEFT JOIN transaction t ON t.id = i."transactionId"
       INNER JOIN ownership o ON o."propertyId" = i."propertyId"
       INNER JOIN "user" u ON u.id = o."userId"
       WHERE i."propertyId" = $1
         AND (i."transactionId" IS NULL OR t.status = $3)
         AND i."incomeTypeId" = u."airbnbIncomeTypeId"
         AND u."airbnbIncomeTypeId" IS NOT NULL
       GROUP BY i."propertyId"
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      [propertyId, statisticKey, acceptedStatus],
    );

    // Yearly aggregation
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         i."propertyId",
         $2,
         EXTRACT(YEAR FROM i."accountingDate")::SMALLINT,
         NULL,
         COUNT(DISTINCT i.id)::TEXT
       FROM income i
       LEFT JOIN transaction t ON t.id = i."transactionId"
       INNER JOIN ownership o ON o."propertyId" = i."propertyId"
       INNER JOIN "user" u ON u.id = o."userId"
       WHERE i."propertyId" = $1
         AND (i."transactionId" IS NULL OR t.status = $3)
         AND i."incomeTypeId" = u."airbnbIncomeTypeId"
         AND u."airbnbIncomeTypeId" IS NOT NULL
       GROUP BY i."propertyId", EXTRACT(YEAR FROM i."accountingDate")
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      [propertyId, statisticKey, acceptedStatus],
    );

    // Monthly aggregation
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         i."propertyId",
         $2,
         EXTRACT(YEAR FROM i."accountingDate")::SMALLINT,
         EXTRACT(MONTH FROM i."accountingDate")::SMALLINT,
         COUNT(DISTINCT i.id)::TEXT
       FROM income i
       LEFT JOIN transaction t ON t.id = i."transactionId"
       INNER JOIN ownership o ON o."propertyId" = i."propertyId"
       INNER JOIN "user" u ON u.id = o."userId"
       WHERE i."propertyId" = $1
         AND (i."transactionId" IS NULL OR t.status = $3)
         AND i."incomeTypeId" = u."airbnbIncomeTypeId"
         AND u."airbnbIncomeTypeId" IS NOT NULL
       GROUP BY i."propertyId", EXTRACT(YEAR FROM i."accountingDate"), EXTRACT(MONTH FROM i."accountingDate")
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      [propertyId, statisticKey, acceptedStatus],
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

  @OnEvent(Events.User.AirbnbIncomeTypeChanged)
  async handleAirbnbIncomeTypeChanged(
    event: UserAirbnbIncomeTypeChangedEvent,
  ): Promise<void> {
    this.eventTracker.increment();
    try {
      // Recalculate statistics for all properties owned by this user
      for (const propertyId of event.propertyIds) {
        await this.recalculateAirbnbVisits(propertyId);
      }
    } finally {
      this.eventTracker.decrement();
    }
  }
}
