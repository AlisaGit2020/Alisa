/*
Data service test
*/
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { OpImportService } from './op-import.service';
import { MOCKS_PATH } from '@alisa-backend/constants';
import {
  INestApplication,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ExpenseService } from '@alisa-backend/accounting/expense/expense.service';
import { IncomeService } from '@alisa-backend/accounting/income/income.service';
import { OpImportInput } from './dtos/op-import-input.dto';

import {
  addIncomeAndExpenseTypes,
  getTestUsers,
  prepareDatabase,
  sleep,
  TestUser,
  TestUsersSetup,
} from '../../../test/helper-functions';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';

describe('OpImport service', () => {
  let service: OpImportService;
  let expenseService: ExpenseService;
  let incomeService: IncomeService;
  let transactionService: TransactionService;
  let app: INestApplication;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;

  const opImportInput: OpImportInput = {
    file: `${MOCKS_PATH}/import/op.transactions.csv`,
    propertyId: 1,
    expenseTypeId: 1,
    incomeTypeId: 1,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<OpImportService>(OpImportService);
    incomeService = app.get<IncomeService>(IncomeService);
    expenseService = app.get<ExpenseService>(ExpenseService);
    transactionService = app.get<TransactionService>(TransactionService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;
    await addIncomeAndExpenseTypes(app);

    //Do the import
    await service.importCsv(mainUser.jwtUser, opImportInput);
  });

  afterAll(async () => {
    await app.close();
  });

  const checkBalance = async (
    propertyId = opImportInput.propertyId,
    balance = -331.55,
  ) => {
    return expect(
      await transactionService.getBalance(mainUser.jwtUser, propertyId),
    ).toBe(balance);
  };

  it('import CSV', async () => {
    const expenses = await expenseService.search(mainUser.jwtUser, {});
    const incomes = await incomeService.search(mainUser.jwtUser, {});

    expect(expenses.length).toBe(7);
    expect(incomes.length).toBe(13);
    await checkBalance();
  });

  it('does not add double', async () => {
    await service.importCsv(mainUser.jwtUser, opImportInput);

    const expenses = await expenseService.search(mainUser.jwtUser, {});
    const incomes = await incomeService.search(mainUser.jwtUser, {});

    expect(expenses.length).toBe(7);
    expect(incomes.length).toBe(13);
    await checkBalance();
  });

  it('saves expense transaction correctly', async () => {
    const transactions = await transactionService.search(mainUser.jwtUser, {
      where: { id: 2 },
    });
    const transaction = transactions[0];
    expect(transaction.externalId).toBe(
      'df0fe65687b70c62e4d30a6731707f9f394fe01e9d388195829aa716892a1adc',
    );
    expect(transaction.description).toBe('Suihkuverho');
    expect(transaction.amount).toBe(-17.5);
    expect(transaction.transactionDate).toEqual(new Date('2023-12-02'));
    expect(transaction.accountingDate).toEqual(new Date('2023-12-02'));
  });

  it('saves income transaction correctly', async () => {
    const transactions = await transactionService.search(mainUser.jwtUser, {
      where: { id: 4 },
    });
    const transaction = transactions[0];
    expect(transaction.externalId).toBe(
      'ff6a6f1b1ca1902ad39418796c20c2e93b1564a31d331a9e271072dc3492b0a4',
    );
    expect(transaction.description).toBe('Airbnb BOFAIE3X');
    expect(transaction.amount).toBe(59.69);
    expect(transaction.transactionDate).toEqual(new Date('2023-12-04'));
    expect(transaction.accountingDate).toEqual(new Date('2023-12-04'));
  });

  it('saves expense correctly', async () => {
    const expenses = await expenseService.search(mainUser.jwtUser, {
      where: { id: 1 },
      relations: { transaction: true },
    });
    const expense = expenses[0];

    expect(expense.transactionId).toBe(1);
    expect(expense.propertyId).toBe(1);
    expect(expense.expenseTypeId).toBe(1);
    expect(expense.description).toBe(
      'Lyhennys 200,72 euroa Korko 302,13 euroa Kulut 2,50 euroa OP-bonuksista Jäljellä 74 269,77 euroa',
    );
    expect(expense.amount).toBe(-502.85);
    expect(expense.quantity).toBe(1);
    expect(expense.totalAmount).toBe(502.85);
  });

  it('saves income correctly', async () => {
    const incomes = await incomeService.search(mainUser.jwtUser, {
      where: { id: 1 },
      relations: { transaction: true },
    });
    const income = incomes[0];

    expect(income.transactionId).toBe(4);
    expect(income.propertyId).toBe(1);
    expect(income.incomeTypeId).toBe(1);

    expect(income.description).toBe('Airbnb BOFAIE3X');
    expect(income.amount).toBe(59.69);
    expect(income.quantity).toBe(1);
    expect(income.totalAmount).toBe(59.69);
  });

  it('changes income and expense type when they change', async () => {
    let expenses = await expenseService.search(mainUser.jwtUser, {});
    let incomes = await incomeService.search(mainUser.jwtUser, {});
    expect(expenses[0].propertyId).toBe(1);
    expect(incomes[0].propertyId).toBe(1);

    const input: OpImportInput = {
      file: `${MOCKS_PATH}/import/op.transactions.csv`,
      propertyId: opImportInput.propertyId,
      expenseTypeId: 2,
      incomeTypeId: 2,
    };

    await service.importCsv(mainUser.jwtUser, input);
    await sleep(50);
    expenses = await expenseService.search(mainUser.jwtUser, {});
    incomes = await incomeService.search(mainUser.jwtUser, {});

    expect(expenses[0].propertyId).toBe(1);
    expect(incomes[0].propertyId).toBe(1);
    expect(expenses[0].expenseTypeId).toBe(2);
    expect(incomes[0].incomeTypeId).toBe(2);
    expect(expenses.length).toBe(7);
    expect(incomes.length).toBe(13);
    await checkBalance();
  });

  it('throws not found when property not exist', async () => {
    const input: OpImportInput = {
      file: `${MOCKS_PATH}/import/op.transactions.csv`,
      propertyId: 9999,
      expenseTypeId: 1,
      incomeTypeId: 1,
    };
    await expect(service.importCsv(mainUser.jwtUser, input)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws UnauthorizedException if user does not have access to property', async () => {
    const input: OpImportInput = {
      file: `${MOCKS_PATH}/import/op.transactions.csv`,
      propertyId: 1, //This property is not the user's property
      expenseTypeId: 1,
      incomeTypeId: 1,
    };
    await expect(
      service.importCsv(testUsers.userWithoutProperties.jwtUser, input),
    ).rejects.toThrow(UnauthorizedException);
  });
});
