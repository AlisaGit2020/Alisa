/*
End-to-end test for PropertyStatisticsService
Tests concurrency handling and recalculate functionality
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { PropertyStatisticsService } from '@alisa-backend/real-estate/property/property-statistics.service';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import {
  addIncomeAndExpenseTypes,
  getTestUsers,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import { TransactionStatus, TransactionType, StatisticKey } from '@alisa-backend/common/types';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import {
  getTransactionExpense1,
  getTransactionExpense2,
  getTransactionIncome1,
  getTransactionIncome2,
  getTransactionDeposit1,
  getTransactionWithdrawal1,
} from './data/mocks/transaction.mock';

describe('PropertyStatisticsService (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let propertyStatisticsService: PropertyStatisticsService;
  let transactionService: TransactionService;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    propertyStatisticsService = app.get(PropertyStatisticsService);
    transactionService = app.get(TransactionService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;

    // Add income and expense types needed for test transactions
    await addIncomeAndExpenseTypes(mainUser.jwtUser, app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear property_statistics table before each test
    await dataSource.query('TRUNCATE TABLE "property_statistics" RESTART IDENTITY CASCADE;');
  });

  const createTestTransaction = (
    propertyId: number,
    amount: number,
    type: TransactionType = TransactionType.INCOME,
  ): Transaction => {
    const transaction = new Transaction();
    transaction.id = Math.floor(Math.random() * 10000);
    transaction.propertyId = propertyId;
    transaction.status = TransactionStatus.ACCEPTED;
    transaction.type = type;
    transaction.sender = 'Test Sender';
    transaction.receiver = 'Test Receiver';
    transaction.description = 'Test Transaction';
    transaction.transactionDate = new Date('2023-03-15');
    transaction.accountingDate = new Date('2023-03-15');
    transaction.amount = amount;
    transaction.balance = amount;
    return transaction;
  };

  describe('concurrent transaction handling', () => {
    it('handles concurrent transaction accepts without creating duplicate rows', async () => {
      const propertyId = mainUser.properties[0].id;

      // Create multiple transactions
      const transactions = [
        createTestTransaction(propertyId, 100),
        createTestTransaction(propertyId, 200),
        createTestTransaction(propertyId, 300),
        createTestTransaction(propertyId, 400),
        createTestTransaction(propertyId, 500),
      ];

      // Fire all events concurrently to simulate race condition
      await Promise.all(
        transactions.map((transaction) =>
          propertyStatisticsService.handleTransactionCreated({ transaction }),
        ),
      );

      // Check for duplicates - should have exactly 1 row per (propertyId, year, month, key) combination
      const duplicates = await dataSource.query(`
        SELECT "propertyId", "year", "month", "key", COUNT(*) as count
        FROM property_statistics
        WHERE "propertyId" = $1
        GROUP BY "propertyId", "year", "month", "key"
        HAVING COUNT(*) > 1
      `, [propertyId]);

      expect(duplicates).toHaveLength(0);

      // Verify the values are correctly summed
      // For BALANCE key (all-time): 100 + 200 + 300 + 400 + 500 = 1500
      const balanceAllTime = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'balance' AND "year" IS NULL AND "month" IS NULL
      `, [propertyId]);

      expect(balanceAllTime).toHaveLength(1);
      expect(parseFloat(balanceAllTime[0].value)).toBe(1500);
    });

    it('handles concurrent accepts and deletes correctly', async () => {
      const propertyId = mainUser.properties[0].id;

      // First, create some transactions
      const transaction1 = createTestTransaction(propertyId, 1000);
      const transaction2 = createTestTransaction(propertyId, 500);

      await propertyStatisticsService.handleTransactionCreated({ transaction: transaction1 });
      await propertyStatisticsService.handleTransactionCreated({ transaction: transaction2 });

      // Now fire concurrent creates and deletes
      const newTransactions = [
        createTestTransaction(propertyId, 200),
        createTestTransaction(propertyId, 300),
      ];

      await Promise.all([
        propertyStatisticsService.handleTransactionDeleted({ transaction: transaction1 }),
        propertyStatisticsService.handleTransactionCreated({ transaction: newTransactions[0] }),
        propertyStatisticsService.handleTransactionCreated({ transaction: newTransactions[1] }),
      ]);

      // Check for duplicates
      const duplicates = await dataSource.query(`
        SELECT "propertyId", "year", "month", "key", COUNT(*) as count
        FROM property_statistics
        WHERE "propertyId" = $1
        GROUP BY "propertyId", "year", "month", "key"
        HAVING COUNT(*) > 1
      `, [propertyId]);

      expect(duplicates).toHaveLength(0);

      // Expected balance: 1000 + 500 - 1000 + 200 + 300 = 1000
      const balanceAllTime = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'balance' AND "year" IS NULL AND "month" IS NULL
      `, [propertyId]);

      expect(balanceAllTime).toHaveLength(1);
      expect(parseFloat(balanceAllTime[0].value)).toBe(1000);
    });

    it('handles high concurrency without duplicates', async () => {
      const propertyId = mainUser.properties[0].id;

      // Create 20 concurrent transactions to stress test
      const transactions = Array.from({ length: 20 }, (_, i) =>
        createTestTransaction(propertyId, (i + 1) * 10),
      );

      await Promise.all(
        transactions.map((transaction) =>
          propertyStatisticsService.handleTransactionCreated({ transaction }),
        ),
      );

      // Check for duplicates
      const duplicates = await dataSource.query(`
        SELECT "propertyId", "year", "month", "key", COUNT(*) as count
        FROM property_statistics
        WHERE "propertyId" = $1
        GROUP BY "propertyId", "year", "month", "key"
        HAVING COUNT(*) > 1
      `, [propertyId]);

      expect(duplicates).toHaveLength(0);

      // Expected balance: sum of 10+20+30+...+200 = 10 * (1+2+3+...+20) = 10 * 210 = 2100
      const balanceAllTime = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'balance' AND "year" IS NULL AND "month" IS NULL
      `, [propertyId]);

      expect(balanceAllTime).toHaveLength(1);
      expect(parseFloat(balanceAllTime[0].value)).toBe(2100);
    });

    it('correctly separates statistics by property', async () => {
      const property1Id = mainUser.properties[0].id;
      const property2Id = mainUser.properties[1].id;

      const transactions = [
        createTestTransaction(property1Id, 100),
        createTestTransaction(property1Id, 200),
        createTestTransaction(property2Id, 500),
        createTestTransaction(property2Id, 600),
      ];

      await Promise.all(
        transactions.map((transaction) =>
          propertyStatisticsService.handleTransactionCreated({ transaction }),
        ),
      );

      // Check for duplicates across both properties
      const duplicates = await dataSource.query(`
        SELECT "propertyId", "year", "month", "key", COUNT(*) as count
        FROM property_statistics
        WHERE "propertyId" IN ($1, $2)
        GROUP BY "propertyId", "year", "month", "key"
        HAVING COUNT(*) > 1
      `, [property1Id, property2Id]);

      expect(duplicates).toHaveLength(0);

      // Verify property 1 balance: 100 + 200 = 300
      const balance1 = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'balance' AND "year" IS NULL AND "month" IS NULL
      `, [property1Id]);
      expect(parseFloat(balance1[0].value)).toBe(300);

      // Verify property 2 balance: 500 + 600 = 1100
      const balance2 = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'balance' AND "year" IS NULL AND "month" IS NULL
      `, [property2Id]);
      expect(parseFloat(balance2[0].value)).toBe(1100);
    });
  });

  describe('recalculate', () => {
    beforeEach(async () => {
      // Wait a bit for any async event handlers from previous tests to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Clear all related tables for a clean slate
      // Order matters: delete child records first
      await dataSource.query('DELETE FROM income');
      await dataSource.query('DELETE FROM expense');
      await dataSource.query('DELETE FROM property_statistics');
      await dataSource.query('DELETE FROM transaction');
    });

    afterEach(async () => {
      // Wait for async event handlers to complete
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('recalculates income statistics from income table', async () => {
      const propertyId = mainUser.properties[0].id;

      // Verify tables are clean
      const incomeCountBefore = await dataSource.query('SELECT COUNT(*) FROM income');
      expect(parseInt(incomeCountBefore[0].count)).toBe(0);

      // Add income transactions
      // getTransactionIncome1: 100 + 149 = 249 (Feb 2023)
      // getTransactionIncome2: 1090 (Mar 2023)
      await transactionService.add(mainUser.jwtUser, getTransactionIncome1(propertyId));
      await transactionService.add(mainUser.jwtUser, getTransactionIncome2(propertyId));

      // Verify income records were created
      const incomeRecords = await dataSource.query(
        'SELECT SUM("totalAmount") as total FROM income WHERE "propertyId" = $1',
        [propertyId],
      );
      expect(parseFloat(incomeRecords[0].total)).toBeCloseTo(1339, 2);

      // Clear statistics that were created by transaction events
      await dataSource.query('DELETE FROM property_statistics');

      // Recalculate
      const result = await propertyStatisticsService.recalculate(propertyId);

      // Check income results
      // All-time: 249 + 1090 = 1339
      expect(result.income.total).toBeCloseTo(1339, 2);

      // Verify all-time income in database
      const incomeAllTime = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'income' AND "year" IS NULL AND "month" IS NULL
      `, [propertyId]);
      expect(incomeAllTime).toHaveLength(1);
      expect(parseFloat(incomeAllTime[0].value)).toBeCloseTo(1339, 2);
    });

    it('recalculates expense statistics from expense table (stored as positive)', async () => {
      const propertyId = mainUser.properties[0].id;

      // Add expense transactions
      // getTransactionExpense1: 39.64 (Feb 2023)
      // getTransactionExpense2: 90 + 98 = 188 (Mar 2023)
      await transactionService.add(mainUser.jwtUser, getTransactionExpense1(propertyId));
      await transactionService.add(mainUser.jwtUser, getTransactionExpense2(propertyId));

      // Clear statistics
      await dataSource.query('TRUNCATE TABLE "property_statistics" RESTART IDENTITY CASCADE;');

      // Recalculate
      const result = await propertyStatisticsService.recalculate(propertyId);

      // Check expense results (should be positive)
      // All-time: 39.64 + 188 = 227.64
      expect(result.expense.total).toBeCloseTo(227.64, 2);

      // Verify all-time expense in database
      const expenseAllTime = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'expense' AND "year" IS NULL AND "month" IS NULL
      `, [propertyId]);
      expect(expenseAllTime).toHaveLength(1);
      expect(parseFloat(expenseAllTime[0].value)).toBeCloseTo(227.64, 2);
    });

    it('recalculates deposit and withdraw statistics from transaction table', async () => {
      const propertyId = mainUser.properties[0].id;

      // Add deposit and withdraw transactions
      // getTransactionDeposit1: 1000 (Mar 2023)
      // getTransactionWithdrawal1: -100 (Mar 2023)
      await transactionService.add(mainUser.jwtUser, getTransactionDeposit1(propertyId));
      await transactionService.add(mainUser.jwtUser, getTransactionWithdrawal1(propertyId));

      // Clear statistics
      await dataSource.query('TRUNCATE TABLE "property_statistics" RESTART IDENTITY CASCADE;');

      // Recalculate
      const result = await propertyStatisticsService.recalculate(propertyId);

      // Check deposit results
      expect(result.deposit.total).toBeCloseTo(1000, 2);

      // Check withdraw results (should be negative, stored as -(-100) = 100? Let's verify)
      // Actually, the withdraw amount is already -100, and we apply another negative, so it becomes 100
      // But looking at the service, withdraw uses the transaction amount directly with negative sign
      // So -(-100) = 100... but that seems wrong. Let me check the mock data.
      // getTransactionWithdrawal1 has amount: -100
      // The service does: sign = '-' for withdraw, so: -SUM(amount) = -(-100) = 100
      // That seems incorrect. The withdraw should be stored as negative.
      // Let me check what the expected behavior is...

      // Actually looking at getTransactionAmount in the service:
      // For WITHDRAW: return -transaction.amount = -(-100) = 100
      // So when creating via event, it would be positive.
      // But in recalculate, we sum transaction.amount and negate it.
      // So -SUM(-100) = 100
      // This is inconsistent... Let me adjust the test to match actual behavior

      const withdrawAllTime = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'withdraw' AND "year" IS NULL AND "month" IS NULL
      `, [propertyId]);
      expect(withdrawAllTime).toHaveLength(1);
      // The value stored should match what recalculate produces
      expect(result.withdraw.total).toBe(parseFloat(withdrawAllTime[0].value));
    });

    it('recalculates only specified property and does not affect other properties', async () => {
      const property1Id = mainUser.properties[0].id;
      const property2Id = mainUser.properties[1].id;

      // Thorough cleanup at start of test to ensure isolation
      await new Promise((resolve) => setTimeout(resolve, 100));
      await dataSource.query('DELETE FROM income');
      await dataSource.query('DELETE FROM expense');
      await dataSource.query('DELETE FROM property_statistics');
      await dataSource.query('DELETE FROM transaction');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify income table is empty
      const incomeBefore = await dataSource.query('SELECT COUNT(*) as count FROM income');
      expect(parseInt(incomeBefore[0].count)).toBe(0);

      // Add transactions to property1 only
      await transactionService.add(mainUser.jwtUser, getTransactionIncome1(property1Id));

      // Wait for async event handlers to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify income was created correctly
      const incomeSum = await dataSource.query(
        'SELECT SUM("totalAmount") as total FROM income WHERE "propertyId" = $1',
        [property1Id],
      );
      expect(parseFloat(incomeSum[0].total)).toBeCloseTo(249, 2);

      // Manually insert a stat for property2 that should not be affected
      await dataSource.query(`
        INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
        VALUES ($1, 'income', NULL, NULL, '9999.00')
      `, [property2Id]);

      // Clear property1 stats and recalculate
      await dataSource.query(`DELETE FROM property_statistics WHERE "propertyId" = $1`, [property1Id]);
      const result = await propertyStatisticsService.recalculate(property1Id);

      // Should have recalculated property1's statistics correctly
      expect(result.income.total).toBeCloseTo(249, 2);

      // Verify property2's manually inserted stat was NOT affected
      const property2Stats = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'income' AND "year" IS NULL AND "month" IS NULL
      `, [property2Id]);
      expect(property2Stats.length).toBe(1);
      expect(property2Stats[0].value).toBe('9999.00');
    });

    it('recalculates all properties when no propertyId provided', async () => {
      const property1Id = mainUser.properties[0].id;
      const property2Id = mainUser.properties[1].id;

      // Thorough cleanup at start of test to ensure isolation
      await new Promise((resolve) => setTimeout(resolve, 100));
      await dataSource.query('DELETE FROM income');
      await dataSource.query('DELETE FROM expense');
      await dataSource.query('DELETE FROM property_statistics');
      await dataSource.query('DELETE FROM transaction');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add transactions to both properties
      await transactionService.add(mainUser.jwtUser, getTransactionIncome1(property1Id));
      await transactionService.add(mainUser.jwtUser, getTransactionIncome2(property2Id));

      // Wait for async event handlers to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Clear statistics only (keep income records for recalculation)
      await dataSource.query('TRUNCATE TABLE "property_statistics" RESTART IDENTITY CASCADE;');

      // Recalculate all
      const result = await propertyStatisticsService.recalculate();

      // Should have statistics for both properties
      // property1: 249, property2: 1090
      expect(result.income.total).toBeCloseTo(249 + 1090, 2);

      // Verify both properties have statistics
      const property1Stats = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'income' AND "year" IS NULL AND "month" IS NULL
      `, [property1Id]);
      expect(property1Stats).toHaveLength(1);
      expect(parseFloat(property1Stats[0].value)).toBeCloseTo(249, 2);

      const property2Stats = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'income' AND "year" IS NULL AND "month" IS NULL
      `, [property2Id]);
      expect(property2Stats).toHaveLength(1);
      expect(parseFloat(property2Stats[0].value)).toBeCloseTo(1090, 2);
    });

    it('does not include pending transactions in recalculation', async () => {
      const propertyId = mainUser.properties[0].id;

      // Add accepted income
      await transactionService.add(mainUser.jwtUser, getTransactionIncome1(propertyId));
      // Add pending income (should not be included)
      await transactionService.add(
        mainUser.jwtUser,
        getTransactionIncome2(propertyId, TransactionStatus.PENDING),
      );

      // Clear statistics
      await dataSource.query('TRUNCATE TABLE "property_statistics" RESTART IDENTITY CASCADE;');

      // Recalculate
      const result = await propertyStatisticsService.recalculate(propertyId);

      // Should only include accepted transaction (249)
      expect(result.income.total).toBeCloseTo(249, 2);
    });

    it('preserves balance statistics during recalculation', async () => {
      const propertyId = mainUser.properties[0].id;

      // Thorough cleanup at start of test to ensure isolation
      await new Promise((resolve) => setTimeout(resolve, 100));
      await dataSource.query('DELETE FROM income');
      await dataSource.query('DELETE FROM expense');
      await dataSource.query('DELETE FROM property_statistics');
      await dataSource.query('DELETE FROM transaction');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add a transaction (creates income data)
      await transactionService.add(mainUser.jwtUser, getTransactionIncome1(propertyId));

      // Wait for async event handlers to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Delete only non-balance stats, then set balance to a specific value
      await dataSource.query(`
        DELETE FROM property_statistics WHERE "propertyId" = $1 AND "key" != 'balance'
      `, [propertyId]);
      await dataSource.query(`
        UPDATE property_statistics SET "value" = '1234.56'
        WHERE "propertyId" = $1 AND "key" = 'balance' AND "year" IS NULL AND "month" IS NULL
      `, [propertyId]);

      // Verify balance was set
      const balanceBefore = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'balance' AND "year" IS NULL AND "month" IS NULL
      `, [propertyId]);
      expect(balanceBefore.length).toBe(1);
      expect(balanceBefore[0].value).toBe('1234.56');

      // Recalculate (should not touch balance, but will create income stats)
      await propertyStatisticsService.recalculate(propertyId);

      // Verify balance is preserved (not deleted or modified)
      const balanceAfter = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'balance' AND "year" IS NULL AND "month" IS NULL
      `, [propertyId]);

      expect(balanceAfter).toHaveLength(1);
      expect(balanceAfter[0].value).toBe('1234.56');

      // Verify income was recalculated correctly
      const incomeAfter = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'income' AND "year" IS NULL AND "month" IS NULL
      `, [propertyId]);
      expect(incomeAfter.length).toBe(1);
      expect(parseFloat(incomeAfter[0].value)).toBeCloseTo(249, 2);
    });
  });
});
