import { ExpenseTypeInputDto } from '@alisa-backend/accounting/expense/dtos/expense-type-input.dto';
import { ExpenseTypeService } from '@alisa-backend/accounting/expense/expense-type.service';
import { IncomeTypeInputDto } from '@alisa-backend/accounting/income/dtos/income-type-input.dto';
import { IncomeTypeService } from '@alisa-backend/accounting/income/income-type.service';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { JWTUser } from '@alisa-backend/auth/types';
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
import {
  expenseType1,
  expenseType2,
  expenseType3,
  incomeType1,
  incomeType2,
  getTransactionExpense1,
  getTransactionExpense2,
  getTransactionIncome1,
  getTransactionIncome2,
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
    'expense',
    'expense_type',
    'income',
    'income_type',
    'transaction',
    'ownership',
    'user',
    'property',
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

export const prepareDatabase = async (app: INestApplication): Promise<void> => {
  const dataSource = app.get(DataSource);
  return emptyTables(dataSource);
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

export const addIncomeAndExpenseTypes = async (
  user: JWTUser,
  app: INestApplication,
): Promise<void> => {
  const incomeTypeService = app.get<IncomeTypeService>(IncomeTypeService);
  const expenseTypeService = app.get<ExpenseTypeService>(ExpenseTypeService);

  for (const expenseType of [expenseType1, expenseType2, expenseType3]) {
    await expenseTypeService.add(user, expenseType);
  }

  for (const incomeType of [incomeType1, incomeType2, expenseType3]) {
    await incomeTypeService.add(incomeType);
  }
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
      await addTransaction(
        user.jwtUser,
        getTransactionExpense1(user.properties[index].id),
      );
      await addTransaction(
        user.jwtUser,
        getTransactionExpense2(user.properties[index].id),
      );
      await addTransaction(
        user.jwtUser,
        getTransactionIncome1(user.properties[index].id),
      );
      await addTransaction(
        user.jwtUser,
        getTransactionIncome2(user.properties[index].id),
      );
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

  const ownership = new OwnershipInputDto();
  ownership.share = 100;
  inputProperty.ownerships.push(ownership);

  return service.add(user, inputProperty);
};

export const addExpenseType = async (
  user: JWTUser,
  service: ExpenseTypeService,
  name: string,
  description: string = '',
  isTaxDeductible: boolean = false,
) => {
  const expenseType = new ExpenseTypeInputDto();
  expenseType.name = name;
  expenseType.description = description;
  expenseType.isTaxDeductible = isTaxDeductible;

  await service.add(user, expenseType);
};

export const addIncomeType = async (
  service: IncomeTypeService,
  name: string,
  description: string = '',
) => {
  const incomeType = new IncomeTypeInputDto();
  incomeType.name = name;
  incomeType.description = description;

  await service.add(incomeType);
};

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
