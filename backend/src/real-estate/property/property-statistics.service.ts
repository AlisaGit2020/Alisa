import {forwardRef, Inject, Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {DataSource, FindManyOptions, In, IsNull, Not, Repository,} from 'typeorm';
import {PropertyStatistics} from '@alisa-backend/real-estate/property/entities/property-statistics.entity';
import {OnEvent} from '@nestjs/event-emitter';
import {
  Events,
  ExpenseAccountingDateChangedEvent,
  IncomeAccountingDateChangedEvent,
  StandaloneExpenseCreatedEvent,
  StandaloneExpenseDeletedEvent,
  StandaloneExpenseUpdatedEvent,
  StandaloneIncomeCreatedEvent,
  StandaloneIncomeDeletedEvent,
  StandaloneIncomeUpdatedEvent,
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@alisa-backend/common/events';
import {StatisticKey, TransactionStatus, TransactionType,} from '@alisa-backend/common/types';
import {Transaction} from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import {JWTUser} from '@alisa-backend/auth/types';
import {PropertyStatisticsFilterDto} from '@alisa-backend/real-estate/property/dtos/property-statistics-filter.dto';
import {PropertyStatisticsSearchDto} from '@alisa-backend/real-estate/property/dtos/property-statistics-search.dto';
import {PropertyService} from '@alisa-backend/real-estate/property/property.service';
import {AuthService} from '@alisa-backend/auth/auth.service';
import {EventTrackerService} from '@alisa-backend/common/event-tracker.service';

@Injectable()
export class PropertyStatisticsService {
  constructor(
    @InjectRepository(PropertyStatistics)
    private repository: Repository<PropertyStatistics>,
    @Inject(forwardRef(() => PropertyService))
    private propertyService: PropertyService,
    private dataSource: DataSource,
    private authService: AuthService,
    private eventTracker: EventTrackerService,
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

  /**
   * Gets available years that have statistics data for the user's properties.
   * @param user The authenticated user
   * @returns Array of years (descending order, most recent first)
   */
  async getAvailableYears(user: JWTUser): Promise<number[]> {
    // Get all property IDs the user owns
    const properties = await this.propertyService.search(user, {
      select: ['id'],
    });

    if (properties.length === 0) {
      return [];
    }

    const propertyIds = properties.map((p) => p.id);

    // Query distinct years from property_statistics
    const result = await this.dataSource.query(
      `SELECT DISTINCT year FROM property_statistics
       WHERE "propertyId" = ANY($1) AND year IS NOT NULL
       ORDER BY year DESC`,
      [propertyIds],
    );

    return result.map((row: { year: number }) => row.year);
  }

  async search(
    user: JWTUser,
    filter: PropertyStatisticsFilterDto,
  ): Promise<PropertyStatistics[]> {
    // Validate user owns the property before returning statistics
    if (!(await this.authService.hasOwnership(user, filter.propertyId))) {
      return [];
    }

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

  async searchAll(
    user: JWTUser,
    filter: PropertyStatisticsSearchDto,
  ): Promise<PropertyStatistics[]> {

    let propertyIds: number[];

    if (filter.propertyId) {
      // Single property specified - validate user owns it
      if (!(await this.authService.hasOwnership(user, filter.propertyId))) {
        return [];
      }
      propertyIds = [filter.propertyId];
    } else {
      // Get all user's properties
      const properties = await this.propertyService.search(user, {
        select: ['id'],
      });

      if (properties.length === 0) {
        return [];
      }

      propertyIds = properties.map((p) => p.id);
    }

    // Build query based on filter
    const whereCondition: Record<string, unknown> = {
      propertyId: In(propertyIds),
    };

    if (filter.key) {
      whereCondition.key = filter.key;
    }

    if (filter.year !== undefined) {
      whereCondition.year = filter.year;
    } else if (filter.includeYearly) {
      // Get all yearly records (year is not null)
      whereCondition.year = Not(IsNull());
    } else {
      whereCondition.year = IsNull();
    }

    if (filter.month !== undefined) {
      whereCondition.month = filter.month;
    } else if (filter.includeMonthly) {
      // Get all monthly records (month is not null)
      whereCondition.month = Not(IsNull());
    } else {
      whereCondition.month = IsNull();
    }

    return await this.repository.find({
      where: whereCondition,
      order: {
        year: 'ASC',
        month: 'ASC',
        key: 'ASC',
      },
    });
  }

  @OnEvent(Events.Transaction.Accepted)
  async handleTransactionCreated(
    event: TransactionCreatedEvent,
  ): Promise<void> {
    this.eventTracker.increment();
    try {
      const eCase = this.EventCases.CREATED;
      for (const key of this.statisticTypes) {
        await this.transactionAcceptedAllTime(eCase, key, event.transaction);
        await this.transactionAcceptedYearly(eCase, key, event.transaction);
        await this.transactionAcceptedMonthly(eCase, key, event.transaction);
      }
    } finally {
      this.eventTracker.decrement();
    }
  }

  @OnEvent(Events.Transaction.Deleted)
  async handleTransactionDeleted(
    event: TransactionDeletedEvent,
  ): Promise<void> {
    this.eventTracker.increment();
    try {
      const eCase = this.EventCases.DELETED;
      for (const key of this.statisticTypes) {
        await this.transactionAcceptedAllTime(eCase, key, event.transaction);
        await this.transactionAcceptedYearly(eCase, key, event.transaction);
        await this.transactionAcceptedMonthly(eCase, key, event.transaction);
      }
    } finally {
      this.eventTracker.decrement();
    }
  }

  @OnEvent(Events.Expense.AccountingDateChanged)
  async handleExpenseAccountingDateChanged(
    event: ExpenseAccountingDateChangedEvent,
  ): Promise<void> {
    this.eventTracker.increment();
    try {
      const { expense, oldAccountingDate } = event;
      // Incremental: subtract from old bucket, add to new bucket
      await this.upsertExpenseStatistic(
        expense.propertyId,
        oldAccountingDate,
        -expense.totalAmount,
      );
      await this.upsertExpenseStatistic(
        expense.propertyId,
        expense.accountingDate,
        expense.totalAmount,
      );
    } finally {
      this.eventTracker.decrement();
    }
  }

  @OnEvent(Events.Income.AccountingDateChanged)
  async handleIncomeAccountingDateChanged(
    event: IncomeAccountingDateChangedEvent,
  ): Promise<void> {
    this.eventTracker.increment();
    try {
      const { income, oldAccountingDate } = event;
      // Incremental: subtract from old bucket, add to new bucket
      await this.upsertIncomeStatistic(
        income.propertyId,
        oldAccountingDate,
        -income.totalAmount,
      );
      await this.upsertIncomeStatistic(
        income.propertyId,
        income.accountingDate,
        income.totalAmount,
      );
    } finally {
      this.eventTracker.decrement();
    }
  }

  @OnEvent(Events.Income.StandaloneCreated)
  async handleStandaloneIncomeCreated(
    event: StandaloneIncomeCreatedEvent,
  ): Promise<void> {
    this.eventTracker.increment();
    try {
      const { income } = event;
      // Incremental update: add the new income amount
      await this.upsertIncomeStatistic(
        income.propertyId,
        income.accountingDate,
        income.totalAmount,
      );
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
      const { income, oldTotalAmount, oldAccountingDate } = event;
      const oldYear = oldAccountingDate ? new Date(oldAccountingDate).getFullYear() : null;
      const oldMonth = oldAccountingDate ? new Date(oldAccountingDate).getMonth() + 1 : null;
      const newYear = income.accountingDate ? new Date(income.accountingDate).getFullYear() : null;
      const newMonth = income.accountingDate ? new Date(income.accountingDate).getMonth() + 1 : null;

      // Check if accounting date changed (different year/month bucket)
      const bucketChanged = oldYear !== newYear || oldMonth !== newMonth;

      if (bucketChanged) {
        // Subtract from old bucket
        await this.upsertIncomeStatistic(
          income.propertyId,
          oldAccountingDate,
          -oldTotalAmount,
        );
        // Add to new bucket
        await this.upsertIncomeStatistic(
          income.propertyId,
          income.accountingDate,
          income.totalAmount,
        );
      } else {
        // Same bucket, just update the delta
        const delta = income.totalAmount - oldTotalAmount;
        await this.upsertIncomeStatistic(
          income.propertyId,
          income.accountingDate,
          delta,
        );
      }
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
      const { income } = event;
      // Incremental update: subtract the deleted income amount
      await this.upsertIncomeStatistic(
        income.propertyId,
        income.accountingDate,
        -income.totalAmount,
      );
    } finally {
      this.eventTracker.decrement();
    }
  }

  @OnEvent(Events.Expense.StandaloneCreated)
  async handleStandaloneExpenseCreated(
    event: StandaloneExpenseCreatedEvent,
  ): Promise<void> {
    this.eventTracker.increment();
    try {
      const { expense } = event;
      // Incremental update: add the new expense amount
      await this.upsertExpenseStatistic(
        expense.propertyId,
        expense.accountingDate,
        expense.totalAmount,
      );
    } finally {
      this.eventTracker.decrement();
    }
  }

  @OnEvent(Events.Expense.StandaloneUpdated)
  async handleStandaloneExpenseUpdated(
    event: StandaloneExpenseUpdatedEvent,
  ): Promise<void> {
    this.eventTracker.increment();
    try {
      const { expense, oldTotalAmount, oldAccountingDate } = event;
      const oldYear = oldAccountingDate ? new Date(oldAccountingDate).getFullYear() : null;
      const oldMonth = oldAccountingDate ? new Date(oldAccountingDate).getMonth() + 1 : null;
      const newYear = expense.accountingDate ? new Date(expense.accountingDate).getFullYear() : null;
      const newMonth = expense.accountingDate ? new Date(expense.accountingDate).getMonth() + 1 : null;

      // Check if accounting date changed (different year/month bucket)
      const bucketChanged = oldYear !== newYear || oldMonth !== newMonth;

      if (bucketChanged) {
        // Subtract from old bucket
        await this.upsertExpenseStatistic(
          expense.propertyId,
          oldAccountingDate,
          -oldTotalAmount,
        );
        // Add to new bucket
        await this.upsertExpenseStatistic(
          expense.propertyId,
          expense.accountingDate,
          expense.totalAmount,
        );
      } else {
        // Same bucket, just update the delta
        const delta = expense.totalAmount - oldTotalAmount;
        await this.upsertExpenseStatistic(
          expense.propertyId,
          expense.accountingDate,
          delta,
        );
      }
    } finally {
      this.eventTracker.decrement();
    }
  }

  @OnEvent(Events.Expense.StandaloneDeleted)
  async handleStandaloneExpenseDeleted(
    event: StandaloneExpenseDeletedEvent,
  ): Promise<void> {
    this.eventTracker.increment();
    try {
      const { expense } = event;
      // Incremental update: subtract the deleted expense amount
      await this.upsertExpenseStatistic(
        expense.propertyId,
        expense.accountingDate,
        -expense.totalAmount,
      );
    } finally {
      this.eventTracker.decrement();
    }
  }

  private async upsertIncomeStatistic(
    propertyId: number,
    accountingDate: Date,
    delta: number,
  ): Promise<void> {
    const key = StatisticKey.INCOME;
    const decimals = this.decimals.get(key) ?? 2;
    const year = accountingDate ? new Date(accountingDate).getFullYear() : null;
    const month = accountingDate ? new Date(accountingDate).getMonth() + 1 : null;

    // Upsert all-time
    await this.upsertStatisticDirect(propertyId, key, null, null, delta, decimals);
    // Upsert yearly
    await this.upsertStatisticDirect(propertyId, key, year, null, delta, decimals);
    // Upsert monthly
    await this.upsertStatisticDirect(propertyId, key, year, month, delta, decimals);
  }

  private async upsertExpenseStatistic(
    propertyId: number,
    accountingDate: Date,
    delta: number,
  ): Promise<void> {
    const key = StatisticKey.EXPENSE;
    const decimals = this.decimals.get(key) ?? 2;
    const year = accountingDate ? new Date(accountingDate).getFullYear() : null;
    const month = accountingDate ? new Date(accountingDate).getMonth() + 1 : null;

    // Upsert all-time
    await this.upsertStatisticDirect(propertyId, key, null, null, delta, decimals);
    // Upsert yearly
    await this.upsertStatisticDirect(propertyId, key, year, null, delta, decimals);
    // Upsert monthly
    await this.upsertStatisticDirect(propertyId, key, year, month, delta, decimals);
  }

  private async upsertStatisticDirect(
    propertyId: number,
    key: StatisticKey,
    year: number | null,
    month: number | null,
    delta: number,
    decimals: number,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = (CAST(property_statistics."value" AS DECIMAL) + $6)::TEXT`,
      [propertyId, key, year, month, delta.toFixed(decimals), delta],
    );
  }

  private async upsertStatistic(
    propertyId: number,
    key: StatisticKey,
    year: number | null,
    month: number | null,
    eventCase: string,
    transaction: Transaction,
  ): Promise<void> {
    const amount = this.getTransactionAmount(key, transaction);
    const delta = eventCase === this.EventCases.CREATED ? amount : -amount;
    const decimals = this.decimals.get(key) ?? 2;

    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = (CAST(property_statistics."value" AS DECIMAL) + $6)::TEXT`,
      [propertyId, key, year, month, delta.toFixed(decimals), delta],
    );
  }

  private getTransactionAmount(key: StatisticKey, transaction: Transaction): number {
    // WITHDRAW and EXPENSE transactions have negative amounts (e.g., -100)
    // We negate to store positive values in statistics (e.g., 100)
    // This matches recalculation behavior which uses positive totalAmount from expense table
    // and -SUM(amount) for withdrawals
    if (key === StatisticKey.WITHDRAW || key === StatisticKey.EXPENSE) {
      return -transaction.amount;
    }
    return transaction.amount;
  }

  private async transactionAcceptedAllTime(
    eventCase: string,
    key: StatisticKey,
    transaction: Transaction,
  ): Promise<void> {
    if (!this.weInterestedIn(key, transaction)) {
      return;
    }
    await this.upsertStatistic(
      transaction.propertyId,
      key,
      null,
      null,
      eventCase,
      transaction,
    );
  }

  private async transactionAcceptedYearly(
    eventCase: string,
    key: StatisticKey,
    transaction: Transaction,
  ): Promise<void> {
    if (!this.weInterestedIn(key, transaction)) {
      return;
    }
    const year = this.getYear(key, transaction);
    await this.upsertStatistic(
      transaction.propertyId,
      key,
      year,
      null,
      eventCase,
      transaction,
    );
  }

  private async transactionAcceptedMonthly(
    eventCase: string,
    key: StatisticKey,
    transaction: Transaction,
  ): Promise<void> {
    if (!this.weInterestedIn(key, transaction)) {
      return;
    }
    const year = this.getYear(key, transaction);
    const month = this.getMonth(key, transaction);
    await this.upsertStatistic(
      transaction.propertyId,
      key,
      year,
      month,
      eventCase,
      transaction,
    );
  }

  private getYear(key: string, transaction: Transaction): number {
    const date = this.getRelevanceDate(key, transaction);
    return new Date(date).getFullYear();
  }

  private getMonth(key: string, transaction: Transaction): number {
    const date = this.getRelevanceDate(key, transaction);
    return new Date(date).getMonth() + 1;
  }

  /**
   * Gets the relevant date for statistics based on the key.
   * For INCOME/EXPENSE: uses the income/expense's accountingDate if available.
   * For BALANCE/DEPOSIT/WITHDRAW: uses the transaction's date field.
   */
  private getRelevanceDate(key: string, transaction: Transaction): Date {
    const dateField = this.relevanceDateField.get(key);

    // For INCOME statistics, use the income's accountingDate
    if (key === StatisticKey.INCOME && transaction.incomes?.length > 0) {
      const incomeDate = transaction.incomes[0].accountingDate;
      if (incomeDate) {
        return incomeDate;
      }
    }

    // For EXPENSE statistics, use the expense's accountingDate
    if (key === StatisticKey.EXPENSE && transaction.expenses?.length > 0) {
      const expenseDate = transaction.expenses[0].accountingDate;
      if (expenseDate) {
        return expenseDate;
      }
    }

    // Fall back to transaction's date field
    return transaction[dateField];
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

  /**
   * Recalculates property statistics from source tables.
   * Recalculates: income, expense, deposit, withdraw (NOT balance).
   * @param propertyId Optional - if provided, only recalculates for that property
   * @returns Summary of recalculated statistics
   */
  async recalculate(propertyId?: number): Promise<RecalculateResult> {
    const propertyFilter = propertyId ? 'AND t."propertyId" = $1' : '';
    const incomePropertyFilter = propertyId ? 'AND i."propertyId" = $1' : '';
    const expensePropertyFilter = propertyId ? 'AND e."propertyId" = $1' : '';
    const params = propertyId ? [propertyId] : [];

    // Delete existing statistics (except balance)
    const keysToRecalculate = [
      StatisticKey.INCOME,
      StatisticKey.EXPENSE,
      StatisticKey.DEPOSIT,
      StatisticKey.WITHDRAW,
    ];

    if (propertyId) {
      await this.repository.delete({
        propertyId,
        key: In(keysToRecalculate),
      });
    } else {
      await this.repository.delete({
        key: In(keysToRecalculate),
      });
    }

    // Recalculate INCOME from income table
    await this.recalculateIncomeStatistics(incomePropertyFilter, params);

    // Recalculate EXPENSE from expense table
    await this.recalculateExpenseStatistics(expensePropertyFilter, params);

    // Recalculate DEPOSIT from transaction table
    await this.recalculateTransactionTypeStatistics(
      StatisticKey.DEPOSIT,
      TransactionType.DEPOSIT,
      propertyFilter,
      params,
      false, // not negative
    );

    // Recalculate WITHDRAW from transaction table
    await this.recalculateTransactionTypeStatistics(
      StatisticKey.WITHDRAW,
      TransactionType.WITHDRAW,
      propertyFilter,
      params,
      true, // negative
    );

    // Return summary
    const summary = await this.getRecalculateSummary(propertyId);
    return summary;
  }

  /**
   * Recalculates property statistics for multiple properties.
   * Only recalculates statistics for the specified property IDs.
   * @param propertyIds Array of property IDs to recalculate
   * @returns Combined summary of recalculated statistics
   */
  async recalculateForProperties(propertyIds: number[]): Promise<RecalculateResult> {
    const combinedResult: RecalculateResult = {
      income: { count: 0, total: 0 },
      expense: { count: 0, total: 0 },
      deposit: { count: 0, total: 0 },
      withdraw: { count: 0, total: 0 },
    };

    for (const propertyId of propertyIds) {
      const result = await this.recalculate(propertyId);
      combinedResult.income.count += result.income.count;
      combinedResult.income.total += result.income.total;
      combinedResult.expense.count += result.expense.count;
      combinedResult.expense.total += result.expense.total;
      combinedResult.deposit.count += result.deposit.count;
      combinedResult.deposit.total += result.deposit.total;
      combinedResult.withdraw.count += result.withdraw.count;
      combinedResult.withdraw.total += result.withdraw.total;
    }

    return combinedResult;
  }

  private async recalculateIncomeStatistics(
    propertyFilter: string,
    params: number[],
  ): Promise<void> {
    const decimals = this.decimals.get(StatisticKey.INCOME);

    // All-time
    // Include: standalone income (no transaction) OR income linked to ACCEPTED transaction
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         i."propertyId",
         '${StatisticKey.INCOME}',
         NULL,
         NULL,
         ROUND(COALESCE(SUM(i."totalAmount"), 0), ${decimals})::TEXT
       FROM income i
       LEFT JOIN transaction t ON t.id = i."transactionId"
       WHERE (i."transactionId" IS NULL OR t.status = ${TransactionStatus.ACCEPTED}) ${propertyFilter}
       GROUP BY i."propertyId"
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      params,
    );

    // Yearly
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         i."propertyId",
         '${StatisticKey.INCOME}',
         EXTRACT(YEAR FROM i."accountingDate")::SMALLINT,
         NULL,
         ROUND(COALESCE(SUM(i."totalAmount"), 0), ${decimals})::TEXT
       FROM income i
       LEFT JOIN transaction t ON t.id = i."transactionId"
       WHERE (i."transactionId" IS NULL OR t.status = ${TransactionStatus.ACCEPTED}) ${propertyFilter}
       GROUP BY i."propertyId", EXTRACT(YEAR FROM i."accountingDate")
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      params,
    );

    // Monthly
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         i."propertyId",
         '${StatisticKey.INCOME}',
         EXTRACT(YEAR FROM i."accountingDate")::SMALLINT,
         EXTRACT(MONTH FROM i."accountingDate")::SMALLINT,
         ROUND(COALESCE(SUM(i."totalAmount"), 0), ${decimals})::TEXT
       FROM income i
       LEFT JOIN transaction t ON t.id = i."transactionId"
       WHERE (i."transactionId" IS NULL OR t.status = ${TransactionStatus.ACCEPTED}) ${propertyFilter}
       GROUP BY i."propertyId", EXTRACT(YEAR FROM i."accountingDate"), EXTRACT(MONTH FROM i."accountingDate")
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      params,
    );
  }

  private async recalculateExpenseStatistics(
    propertyFilter: string,
    params: number[],
  ): Promise<void> {
    const decimals = this.decimals.get(StatisticKey.EXPENSE);

    // All-time (positive value)
    // Include: standalone expense (no transaction) OR expense linked to ACCEPTED transaction
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         e."propertyId",
         '${StatisticKey.EXPENSE}',
         NULL,
         NULL,
         ROUND(COALESCE(SUM(e."totalAmount"), 0), ${decimals})::TEXT
       FROM expense e
       LEFT JOIN transaction t ON t.id = e."transactionId"
       WHERE (e."transactionId" IS NULL OR t.status = ${TransactionStatus.ACCEPTED}) ${propertyFilter}
       GROUP BY e."propertyId"
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      params,
    );

    // Yearly (positive value)
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         e."propertyId",
         '${StatisticKey.EXPENSE}',
         EXTRACT(YEAR FROM e."accountingDate")::SMALLINT,
         NULL,
         ROUND(COALESCE(SUM(e."totalAmount"), 0), ${decimals})::TEXT
       FROM expense e
       LEFT JOIN transaction t ON t.id = e."transactionId"
       WHERE (e."transactionId" IS NULL OR t.status = ${TransactionStatus.ACCEPTED}) ${propertyFilter}
       GROUP BY e."propertyId", EXTRACT(YEAR FROM e."accountingDate")
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      params,
    );

    // Monthly (positive value)
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         e."propertyId",
         '${StatisticKey.EXPENSE}',
         EXTRACT(YEAR FROM e."accountingDate")::SMALLINT,
         EXTRACT(MONTH FROM e."accountingDate")::SMALLINT,
         ROUND(COALESCE(SUM(e."totalAmount"), 0), ${decimals})::TEXT
       FROM expense e
       LEFT JOIN transaction t ON t.id = e."transactionId"
       WHERE (e."transactionId" IS NULL OR t.status = ${TransactionStatus.ACCEPTED}) ${propertyFilter}
       GROUP BY e."propertyId", EXTRACT(YEAR FROM e."accountingDate"), EXTRACT(MONTH FROM e."accountingDate")
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      params,
    );
  }

  private async recalculateTransactionTypeStatistics(
    key: StatisticKey,
    transactionType: TransactionType,
    propertyFilter: string,
    params: number[],
    negative: boolean,
  ): Promise<void> {
    const decimals = this.decimals.get(key);
    const sign = negative ? '-' : '';

    // All-time
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         t."propertyId",
         '${key}',
         NULL,
         NULL,
         ROUND(${sign}COALESCE(SUM(t.amount), 0), ${decimals})::TEXT
       FROM transaction t
       WHERE t.status = ${TransactionStatus.ACCEPTED} AND t.type = ${transactionType} ${propertyFilter}
       GROUP BY t."propertyId"
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      params,
    );

    // Yearly
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         t."propertyId",
         '${key}',
         EXTRACT(YEAR FROM t."accountingDate")::SMALLINT,
         NULL,
         ROUND(${sign}COALESCE(SUM(t.amount), 0), ${decimals})::TEXT
       FROM transaction t
       WHERE t.status = ${TransactionStatus.ACCEPTED} AND t.type = ${transactionType} ${propertyFilter}
       GROUP BY t."propertyId", EXTRACT(YEAR FROM t."accountingDate")
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      params,
    );

    // Monthly
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       SELECT
         t."propertyId",
         '${key}',
         EXTRACT(YEAR FROM t."accountingDate")::SMALLINT,
         EXTRACT(MONTH FROM t."accountingDate")::SMALLINT,
         ROUND(${sign}COALESCE(SUM(t.amount), 0), ${decimals})::TEXT
       FROM transaction t
       WHERE t.status = ${TransactionStatus.ACCEPTED} AND t.type = ${transactionType} ${propertyFilter}
       GROUP BY t."propertyId", EXTRACT(YEAR FROM t."accountingDate"), EXTRACT(MONTH FROM t."accountingDate")
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      params,
    );
  }

  private async getRecalculateSummary(
    propertyId?: number,
  ): Promise<RecalculateResult> {
    const keysToRecalculate = [
      StatisticKey.INCOME,
      StatisticKey.EXPENSE,
      StatisticKey.DEPOSIT,
      StatisticKey.WITHDRAW,
    ];

    // Only count all-time statistics (year IS NULL, month IS NULL) for the summary
    const whereCondition: Record<string, unknown> = {
      key: In(keysToRecalculate),
      year: IsNull(),
      month: IsNull(),
    };
    if (propertyId) {
      whereCondition.propertyId = propertyId;
    }

    const stats = await this.repository.find({ where: whereCondition });

    const result: RecalculateResult = {
      income: { count: 0, total: 0 },
      expense: { count: 0, total: 0 },
      deposit: { count: 0, total: 0 },
      withdraw: { count: 0, total: 0 },
    };

    for (const stat of stats) {
      const value = parseFloat(stat.value) || 0;
      switch (stat.key) {
        case StatisticKey.INCOME:
          result.income.count++;
          result.income.total += value;
          break;
        case StatisticKey.EXPENSE:
          result.expense.count++;
          result.expense.total += value;
          break;
        case StatisticKey.DEPOSIT:
          result.deposit.count++;
          result.deposit.total += value;
          break;
        case StatisticKey.WITHDRAW:
          result.withdraw.count++;
          result.withdraw.total += value;
          break;
      }
    }

    return result;
  }
}

export interface RecalculateResult {
  income: { count: number; total: number };
  expense: { count: number; total: number };
  deposit: { count: number; total: number };
  withdraw: { count: number; total: number };
}
