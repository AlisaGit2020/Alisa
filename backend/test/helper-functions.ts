import { AuthService } from '@alisa-backend/auth/auth.service';
import { JWTUser } from '@alisa-backend/auth/types';
import { ExpenseTypeKey, IncomeTypeKey } from '@alisa-backend/common/types';
import { OwnershipInputDto } from '@alisa-backend/people/ownership/dtos/ownership-input.dto';
import { PropertyInputDto } from '@alisa-backend/real-estate/property/dtos/property-input.dto';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { DataSource } from 'typeorm';
import { jwtUser1, jwtUser2, jwtUser3 } from './data/mocks/user.mock';
import { INestApplication } from '@nestjs/common';
import { UserService } from '@alisa-backend/people/user/user.service';
import { User } from '@alisa-backend/people/user/entities/user.entity';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import { TierService } from '@alisa-backend/admin/tier.service';
import { Tier } from '@alisa-backend/admin/entities/tier.entity';
import { EventTrackerService } from '@alisa-backend/common/event-tracker.service';
import * as http from 'http';
import {
  getTransactionExpense1,
  getTransactionExpense2,
  getTransactionIncome1,
  getTransactionIncome2,
  getTransactionDeposit1,
  getTransactionWithdrawal1,
} from './data/mocks/transaction.mock';

export const getUserAccessToken = async (
  authService: AuthService,
): Promise<string> => {
  return authService.login({
    firstName: 'Test',
    lastName: 'Tester',
    email: 'test@email.com',
  });
};

export const getUserAccessToken2 = async (
  authService: AuthService,
  user: JWTUser,
): Promise<string> => {
  return authService.login(user);
};

export const getBearerToken = (token: string): string => {
  return `Bearer ${token}`;
};

export const emptyTables = async (
  dataSource: DataSource,
  tables: string[] = [
    'feedback',
    'expense',
    'income',
    'transaction',
    'ownership',
    'user',
    'property',
    'property_statistics',
    'tier',
    // Note: expense_type and income_type are now global and seeded by DefaultsSeeder.
    // They should not be truncated unless you plan to re-seed them.
  ],
) => {
  const sqlStatements: string[] = [];

  for (const tableName of tables) {
    sqlStatements.push(
      `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
    );
  }

  const sql = sqlStatements.join(' ');
  await dataSource.query(sql);
  await sleep(10);
};

export const emptyTablesV2 = async (
  app: INestApplication,
  tables?: string[],
): Promise<void> => {
  const dataSource = app.get(DataSource);
  return emptyTables(dataSource, tables);
};

export const prepareDatabase = async (app: INestApplication): Promise<void> => {
  const dataSource = app.get(DataSource);
  await emptyTables(dataSource);
  await ensureAllTypesExist(dataSource);
};

/**
 * Ensures all expense and income types from the enums exist in the database.
 * Uses INSERT ... ON CONFLICT DO NOTHING to safely add missing types.
 */
export const ensureAllTypesExist = async (
  dataSource: DataSource,
): Promise<void> => {
  // Define expense types with their properties
  const expenseTypes: Array<{
    key: ExpenseTypeKey;
    isTaxDeductible: boolean;
    isCapitalImprovement: boolean;
  }> = [
    {
      key: ExpenseTypeKey.HOUSING_CHARGE,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.MAINTENANCE_CHARGE,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.FINANCIAL_CHARGE,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.REPAIRS,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.CAPITAL_IMPROVEMENT,
      isTaxDeductible: false,
      isCapitalImprovement: true,
    },
    {
      key: ExpenseTypeKey.INSURANCE,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.PROPERTY_TAX,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.WATER,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.ELECTRICITY,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.RENTAL_BROKERAGE,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.LOAN_INTEREST,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.LOAN_PRINCIPAL,
      isTaxDeductible: false,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.LOAN_HANDLING_FEE,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.LOAN_PAYMENT,
      isTaxDeductible: false,
      isCapitalImprovement: false,
    },
    {
      key: ExpenseTypeKey.CLEANING,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    },
  ];

  // Define income types with their properties
  const incomeTypes: Array<{ key: IncomeTypeKey; isTaxable: boolean }> = [
    { key: IncomeTypeKey.RENTAL, isTaxable: true },
    { key: IncomeTypeKey.AIRBNB, isTaxable: true },
    { key: IncomeTypeKey.CAPITAL_INCOME, isTaxable: true },
    { key: IncomeTypeKey.INSURANCE_COMPENSATION, isTaxable: true },
  ];

  // Insert expense types
  const expenseValues = expenseTypes
    .map(
      (t) =>
        `('${t.key}', ${t.isTaxDeductible}, ${t.isCapitalImprovement})`,
    )
    .join(', ');

  await dataSource.query(`
    INSERT INTO expense_type (key, "isTaxDeductible", "isCapitalImprovement")
    VALUES ${expenseValues}
    ON CONFLICT (key) DO NOTHING
  `);

  // Insert income types
  const incomeValues = incomeTypes
    .map((t) => `('${t.key}', ${t.isTaxable})`)
    .join(', ');

  await dataSource.query(`
    INSERT INTO income_type (key, "isTaxable")
    VALUES ${incomeValues}
    ON CONFLICT (key) DO NOTHING
  `);
};

export const getTestUsers = async (
  app: INestApplication,
): Promise<TestUsersSetup> => {
  const userService = app.get<UserService>(UserService);
  const propertyService = app.get<PropertyService>(PropertyService);

  const testUsers: TestUsersSetup = {
    userWithoutProperties: {
      user: await userService.add(jwtUser1),
      jwtUser: jwtUser1,
      properties: [],
    },
    user1WithProperties: {
      user: await userService.add(jwtUser2),
      jwtUser: jwtUser2,
      properties: [],
    },
    user2WithProperties: {
      user: await userService.add(jwtUser3),
      jwtUser: jwtUser3,
      properties: [],
    },
  };

  testUsers.userWithoutProperties.jwtUser.id =
    testUsers.userWithoutProperties.user.id;
  testUsers.user1WithProperties.jwtUser.id =
    testUsers.user1WithProperties.user.id;
  testUsers.user2WithProperties.jwtUser.id =
    testUsers.user2WithProperties.user.id;

  const property1 = await addProperty(
    propertyService,
    `User's 1 first property`,
    29,
    testUsers.user1WithProperties.jwtUser,
  );

  const property2 = await addProperty(
    propertyService,
    `User's 1 second property`,
    59,
    testUsers.user1WithProperties.jwtUser,
  );

  const property3 = await addProperty(
    propertyService,
    `User's 2 first property`,
    180,
    testUsers.user2WithProperties.jwtUser,
  );

  const property4 = await addProperty(
    propertyService,
    `User's 2 second property`,
    63,
    testUsers.user2WithProperties.jwtUser,
  );

  testUsers.user1WithProperties.properties = [];
  testUsers.user1WithProperties.properties.push(property1);
  testUsers.user1WithProperties.properties.push(property2);

  testUsers.user2WithProperties.properties = [];
  testUsers.user2WithProperties.properties.push(property3);
  testUsers.user2WithProperties.properties.push(property4);

  return testUsers;
};

// Expense and income types are now global and seeded by DefaultsSeeder.
// These helper functions are kept for backwards compatibility but are no-ops.
export const addIncomeAndExpenseTypes = async (
  user: JWTUser,
  app: INestApplication,
): Promise<void> => {
  void user;
  void app;
  // No-op: Global types are seeded by DefaultsSeeder
};

export const addExpenseTypes = async (
  user: JWTUser,
  app: INestApplication,
): Promise<void> => {
  void user;
  void app;
  // No-op: Global expense types are seeded by DefaultsSeeder
};

export const addIncomeTypes = async (
  user: JWTUser,
  app: INestApplication,
): Promise<void> => {
  void user;
  void app;
  // No-op: Global income types are seeded by DefaultsSeeder
};

export const addTransactionsToTestUsers = async (
  app: INestApplication,
  testUsers: TestUsersSetup,
) => {
  const transactionService = app.get<TransactionService>(TransactionService);

  await addIncomeAndExpenseTypes(testUsers.user1WithProperties.jwtUser, app);

  const addTransaction = async (
    jwtUser: JWTUser,
    transaction: TransactionInputDto,
  ) => {
    await transactionService.add(jwtUser, transaction);
  };

  for (const user of [
    testUsers.user1WithProperties,
    testUsers.user2WithProperties,
  ]) {
    for (const index of [0, 1]) {
      const propertyId = user.properties[index].id;
      await addTransaction(user.jwtUser, getTransactionExpense1(propertyId));
      await addTransaction(user.jwtUser, getTransactionExpense2(propertyId));
      await addTransaction(user.jwtUser, getTransactionIncome1(propertyId));
      await addTransaction(user.jwtUser, getTransactionIncome2(propertyId));
      await addTransaction(user.jwtUser, getTransactionDeposit1(propertyId));
      await addTransaction(user.jwtUser, getTransactionWithdrawal1(propertyId));
    }
  }
};

export const addTransaction = async (
  app: INestApplication,
  jwtUser: JWTUser,
  transaction: TransactionInputDto,
) => {
  const transactionService = app.get<TransactionService>(TransactionService);
  return transactionService.add(jwtUser, transaction);
};

export const addProperty = async (
  service: PropertyService,
  name: string,
  size: number,
  user: JWTUser,
): Promise<Property> => {
  const inputProperty = new PropertyInputDto();
  inputProperty.name = name;
  inputProperty.size = size;
  inputProperty.ownerships = [];

  const ownership = new OwnershipInputDto();
  ownership.share = 100;
  inputProperty.ownerships.push(ownership);

  return service.add(user, inputProperty);
};

// addExpenseType and addIncomeType helper functions have been removed.
// Expense and income types are now global and seeded by DefaultsSeeder.
// Use expenseTypeService.findByKey() or incomeTypeService.findByKey() to get global types.

export const sleep = async (milliseconds: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export type TestUsersSetup = {
  userWithoutProperties: TestUser;
  user1WithProperties: TestUser;
  user2WithProperties: TestUser;
};

export type TestUser = {
  user: User;
  jwtUser: JWTUser;
  properties: Property[];
};

export const addTier = async (
  app: INestApplication,
  name: string,
  price: number,
  maxProperties: number,
  isDefault: boolean = false,
  sortOrder: number = 0,
): Promise<Tier> => {
  const tierService = app.get<TierService>(TierService);
  return tierService.add({
    name,
    price,
    maxProperties,
    isDefault,
    sortOrder,
  });
};

/**
 * Gracefully closes the NestJS application and HTTP server.
 * Waits for pending async event handlers to complete before closing.
 * Use this in afterAll() instead of direct app.close() to prevent
 * "Connection terminated" errors from async operations.
 */
export const closeAppGracefully = async (
  app: INestApplication,
  server: http.Server,
): Promise<void> => {
  const eventTracker = app.get(EventTrackerService);
  await eventTracker.waitForPending();
  await app.close();
  server.close();
};
