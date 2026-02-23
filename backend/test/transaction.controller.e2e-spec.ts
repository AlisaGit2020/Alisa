import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { OpImportService } from '@alisa-backend/import/op/op-import.service';
import { MOCKS_PATH } from '@alisa-backend/constants';
import { OpImportInput } from '@alisa-backend/import/op/dtos/op-import-input.dto';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  addIncomeAndExpenseTypes,
  addTransaction,
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import * as http from 'http';
import {
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';
import {
  getTransactionExpense1,
  getTransactionIncome1,
  getTransactionDeposit1,
} from './data/mocks/transaction.mock';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';

describe('TransactionController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;
  let mainUserToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
    server = app.getHttpServer();

    const opImportService = app.get(OpImportService);
    authService = app.get(AuthService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;

    mainUserToken = await getUserAccessToken2(authService, mainUser.jwtUser);

    await addIncomeAndExpenseTypes(mainUser.jwtUser, app);

    // Import some test transactions for main user
    const input: OpImportInput = {
      propertyId: mainUser.properties[0].id,
      file: `${MOCKS_PATH}/import/op.transactions.csv`,
    };
    await opImportService.importCsv(mainUser.jwtUser, input);
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  // ==========================================
  // 1. POST /accounting/transaction/search
  // ==========================================
  describe('POST /accounting/transaction/search', () => {
    it('returns all transactions for authenticated user', async () => {
      const response = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
    });

    it('filters transaction date correctly', async () => {
      const response = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          where: {
            transactionDate: {
              $between: [new Date('2023-12-01'), new Date('2023-12-04')],
            },
          },
        })
        .expect(200);
      expect(response.body.length).toBe(4);
    });

    it.each([
      [1, 20], // main user's property with imported transactions
      [2, 0], // main user's second property without transactions
    ])(
      'filters by property correctly (propertyId: %i)',
      async (propertyIdOffset: number, expectedCount: number) => {
        const propertyId = testUsers.user1WithProperties.properties[propertyIdOffset - 1]?.id || propertyIdOffset;
        const response = await request(server)
          .post('/accounting/transaction/search')
          .set('Authorization', getBearerToken(mainUserToken))
          .send({
            where: { propertyId: propertyId },
          })
          .expect(200);
        expect(response.body.length).toBe(expectedCount);
      },
    );

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/accounting/transaction/search')
        .expect(401);
    });
  });

  // ==========================================
  // 2. POST /accounting/transaction/search/statistics
  // ==========================================
  describe('POST /accounting/transaction/search/statistics', () => {
    it('returns statistics with filter', async () => {
      const transactionDateFilter = {
        transactionDate: {
          $between: [new Date('2023-12-01'), new Date('2023-12-22')],
        },
      };

      const response = await request(server)
        .post('/accounting/transaction/search/statistics')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          relations: { expense: true, income: true },
          where: { propertyId: mainUser.properties[0].id, ...transactionDateFilter },
        })
        .expect(200);

      expect(response.body).toHaveProperty('rowCount');
      expect(response.body).toHaveProperty('totalExpenses');
      expect(response.body).toHaveProperty('totalIncomes');
      expect(response.body).toHaveProperty('total');
    });

    it('returns statistics without filter', async () => {
      const response = await request(server)
        .post('/accounting/transaction/search/statistics')
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      expect(response.body).toHaveProperty('rowCount');
      expect(response.body).toHaveProperty('totalExpenses');
      expect(response.body).toHaveProperty('totalIncomes');
      expect(response.body).toHaveProperty('total');
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/accounting/transaction/search/statistics')
        .expect(401);
    });
  });

  // ==========================================
  // 3. POST /accounting/transaction - Create transaction
  // ==========================================
  describe('POST /accounting/transaction', () => {
    it('creates a new transaction successfully', async () => {
      const transactionInput: TransactionInputDto = {
        sender: 'Test Sender',
        receiver: 'Test Receiver',
        description: 'Test transaction for e2e',
        transactionDate: new Date('2024-01-15'),
        accountingDate: new Date('2024-01-15'),
        amount: -50,
        propertyId: mainUser.properties[0].id,
        status: TransactionStatus.PENDING,
        type: TransactionType.EXPENSE,
      };

      const response = await request(server)
        .post('/accounting/transaction')
        .set('Authorization', getBearerToken(mainUserToken))
        .send(transactionInput)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.sender).toBe('Test Sender');
      expect(response.body.description).toBe('Test transaction for e2e');
      expect(response.body.status).toBe(TransactionStatus.PENDING);
    });

    it('creates an accepted transaction with valid type', async () => {
      const transactionInput: TransactionInputDto = {
        sender: 'Income Sender',
        receiver: 'Income Receiver',
        description: 'Income transaction',
        transactionDate: new Date('2024-01-16'),
        accountingDate: new Date('2024-01-16'),
        amount: 100,
        propertyId: mainUser.properties[0].id,
        status: TransactionStatus.ACCEPTED,
        type: TransactionType.INCOME,
      };

      const response = await request(server)
        .post('/accounting/transaction')
        .set('Authorization', getBearerToken(mainUserToken))
        .send(transactionInput)
        .expect(201);

      expect(response.body.status).toBe(TransactionStatus.ACCEPTED);
      expect(response.body.type).toBe(TransactionType.INCOME);
    });

    it('returns 400 when creating accepted transaction with unknown type', async () => {
      const transactionInput: TransactionInputDto = {
        sender: 'Bad Sender',
        receiver: 'Bad Receiver',
        description: 'Bad transaction',
        transactionDate: new Date('2024-01-17'),
        accountingDate: new Date('2024-01-17'),
        amount: 50,
        propertyId: mainUser.properties[0].id,
        status: TransactionStatus.ACCEPTED,
        type: TransactionType.UNKNOWN,
      };

      await request(server)
        .post('/accounting/transaction')
        .set('Authorization', getBearerToken(mainUserToken))
        .send(transactionInput)
        .expect(400);
    });

    it('returns 401 when creating transaction for property user does not own', async () => {
      const user2 = testUsers.user2WithProperties;
      const transactionInput: TransactionInputDto = {
        sender: 'Unauthorized Sender',
        receiver: 'Unauthorized Receiver',
        description: 'Unauthorized transaction',
        transactionDate: new Date('2024-01-18'),
        accountingDate: new Date('2024-01-18'),
        amount: 50,
        propertyId: user2.properties[0].id,
        status: TransactionStatus.PENDING,
        type: TransactionType.EXPENSE,
      };

      await request(server)
        .post('/accounting/transaction')
        .set('Authorization', getBearerToken(mainUserToken))
        .send(transactionInput)
        .expect(401);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/accounting/transaction')
        .send({})
        .expect(401);
    });

    it('saves expense rows with correct expenseTypeId and description', async () => {
      const customExpenseTypeId = 2; // Using second expense type
      const customDescription = 'Custom expense description';

      const transactionInput: TransactionInputDto = {
        sender: 'Expense Row Test Sender',
        receiver: 'Expense Row Test Receiver',
        description: 'Transaction with custom expense row',
        transactionDate: new Date('2024-02-15'),
        accountingDate: new Date('2024-02-15'),
        amount: -100,
        propertyId: mainUser.properties[0].id,
        status: TransactionStatus.PENDING,
        type: TransactionType.EXPENSE,
        expenses: [
          {
            expenseTypeId: customExpenseTypeId,
            description: customDescription,
            amount: 100,
            quantity: 1,
            totalAmount: 100,
          },
        ],
      };

      const createResponse = await request(server)
        .post('/accounting/transaction')
        .set('Authorization', getBearerToken(mainUserToken))
        .send(transactionInput)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      const transactionId = createResponse.body.id;

      // Fetch the transaction with expenses relation using search endpoint
      const searchResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          where: { id: transactionId },
          relations: { expenses: true },
        })
        .expect(200);

      expect(searchResponse.body).toHaveLength(1);
      expect(searchResponse.body[0].expenses).toHaveLength(1);
      expect(searchResponse.body[0].expenses[0].expenseTypeId).toBe(customExpenseTypeId);
      expect(searchResponse.body[0].expenses[0].description).toBe(customDescription);
    });
  });

  // ==========================================
  // 4. POST /accounting/transaction/accept
  // ==========================================
  describe('POST /accounting/transaction/accept', () => {
    it('accepts pending transactions with valid type', async () => {
      // First create a pending transaction with valid type
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          ...getTransactionExpense1(mainUser.properties[0].id, TransactionStatus.PENDING),
          externalId: `accept-test-${Date.now()}`,
        },
      );

      const response = await request(server)
        .post('/accounting/transaction/accept')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [transaction.id] })
        .expect(201);

      expect(response.body.allSuccess).toBe(true);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].statusCode).toBe(200);
    });

    it('returns 400 when no ids provided', async () => {
      await request(server)
        .post('/accounting/transaction/accept')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [] })
        .expect(400);
    });

    it('returns error for transactions with unknown type', async () => {
      // Create a pending transaction with unknown type
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Unknown Type Sender',
          receiver: 'Unknown Type Receiver',
          description: 'Unknown type transaction',
          transactionDate: new Date('2024-01-20'),
          accountingDate: new Date('2024-01-20'),
          amount: 50,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          externalId: `unknown-type-${Date.now()}`,
        },
      );

      const response = await request(server)
        .post('/accounting/transaction/accept')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [transaction.id] })
        .expect(201);

      expect(response.body.allSuccess).toBe(false);
      expect(response.body.results[0].statusCode).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/accounting/transaction/accept')
        .send({ ids: [1] })
        .expect(401);
    });
  });

  // ==========================================
  // 5. POST /accounting/transaction/type - Set type
  // ==========================================
  describe('POST /accounting/transaction/type', () => {
    it('sets transaction type successfully', async () => {
      // Create a pending transaction
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Type Test Sender',
          receiver: 'Type Test Receiver',
          description: 'Type test transaction',
          transactionDate: new Date('2024-01-21'),
          accountingDate: new Date('2024-01-21'),
          amount: 50,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          externalId: `type-test-${Date.now()}`,
        },
      );

      const response = await request(server)
        .post('/accounting/transaction/type')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          ids: [transaction.id],
          type: TransactionType.EXPENSE,
        })
        .expect(201);

      expect(response.body.allSuccess).toBe(true);
      expect(response.body.results[0].statusCode).toBe(200);
    });

    it('returns 400 when no ids provided', async () => {
      await request(server)
        .post('/accounting/transaction/type')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [], type: TransactionType.EXPENSE })
        .expect(400);
    });

    it('returns 400 for invalid type', async () => {
      await request(server)
        .post('/accounting/transaction/type')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [1], type: 999 })
        .expect(400);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/accounting/transaction/type')
        .send({ ids: [1], type: TransactionType.EXPENSE })
        .expect(401);
    });
  });

  // ==========================================
  // 6. POST /accounting/transaction/category-type - Set category type
  // ==========================================
  describe('POST /accounting/transaction/category-type', () => {
    it('sets expense type for expense transaction', async () => {
      // Create a pending expense transaction
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Category Test Sender',
          receiver: 'Category Test Receiver',
          description: 'Category test transaction',
          transactionDate: new Date('2024-01-22'),
          accountingDate: new Date('2024-01-22'),
          amount: -100,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.EXPENSE,
          externalId: `category-test-${Date.now()}`,
        },
      );

      const response = await request(server)
        .post('/accounting/transaction/category-type')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          ids: [transaction.id],
          expenseTypeId: 1,
        })
        .expect(201);

      expect(response.body.allSuccess).toBe(true);
    });

    it('sets income type for income transaction', async () => {
      // Create a pending income transaction
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Income Category Sender',
          receiver: 'Income Category Receiver',
          description: 'Income category test',
          transactionDate: new Date('2024-01-23'),
          accountingDate: new Date('2024-01-23'),
          amount: 200,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.INCOME,
          externalId: `income-category-${Date.now()}`,
        },
      );

      const response = await request(server)
        .post('/accounting/transaction/category-type')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          ids: [transaction.id],
          incomeTypeId: 1,
        })
        .expect(201);

      expect(response.body.allSuccess).toBe(true);
    });

    it('returns expenseType when searching with nested relations', async () => {
      // Create a pending expense transaction
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Nested Relation Test Sender',
          receiver: 'Nested Relation Test Receiver',
          description: 'Nested relation test',
          transactionDate: new Date('2024-01-24'),
          accountingDate: new Date('2024-01-24'),
          amount: -300,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.EXPENSE,
          externalId: `nested-relation-${Date.now()}`,
        },
      );

      // Set category type to create expense with expenseTypeId
      await request(server)
        .post('/accounting/transaction/category-type')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          ids: [transaction.id],
          expenseTypeId: 1,
        })
        .expect(201);

      // Search with nested relations (as frontend does)
      const searchResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          select: ['id', 'type', 'transactionDate', 'sender', 'receiver', 'description', 'amount'],
          relations: {
            expenses: { expenseType: true },
            incomes: { incomeType: true },
          },
          where: { id: transaction.id },
        })
        .expect(200);

      expect(searchResponse.body).toHaveLength(1);
      expect(searchResponse.body[0].expenses).toHaveLength(1);
      expect(searchResponse.body[0].expenses[0].expenseType).toBeDefined();
      expect(searchResponse.body[0].expenses[0].expenseType.key).toBeDefined();
    });

    it('returns incomeType when searching with nested relations', async () => {
      // Create a pending income transaction
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Income Nested Relation Test Sender',
          receiver: 'Income Nested Relation Test Receiver',
          description: 'Income nested relation test',
          transactionDate: new Date('2024-01-25'),
          accountingDate: new Date('2024-01-25'),
          amount: 400,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.INCOME,
          externalId: `income-nested-relation-${Date.now()}`,
        },
      );

      // Set category type to create income with incomeTypeId
      await request(server)
        .post('/accounting/transaction/category-type')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          ids: [transaction.id],
          incomeTypeId: 1,
        })
        .expect(201);

      // Search with nested relations (as frontend does)
      const searchResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          select: ['id', 'type', 'transactionDate', 'sender', 'receiver', 'description', 'amount'],
          relations: {
            expenses: { expenseType: true },
            incomes: { incomeType: true },
          },
          where: { id: transaction.id },
        })
        .expect(200);

      expect(searchResponse.body).toHaveLength(1);
      expect(searchResponse.body[0].incomes).toHaveLength(1);
      expect(searchResponse.body[0].incomes[0].incomeType).toBeDefined();
      expect(searchResponse.body[0].incomes[0].incomeType.key).toBeDefined();
    });

    it('returns 400 when no ids provided', async () => {
      await request(server)
        .post('/accounting/transaction/category-type')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [], expenseTypeId: 1 })
        .expect(400);
    });

    it('returns 400 when neither expense nor income type provided', async () => {
      await request(server)
        .post('/accounting/transaction/category-type')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [1] })
        .expect(400);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/accounting/transaction/category-type')
        .send({ ids: [1], expenseTypeId: 1 })
        .expect(401);
    });
  });

  // ==========================================
  // 7. POST /accounting/transaction/split-loan-payment - Bulk split
  // ==========================================
  describe('POST /accounting/transaction/split-loan-payment', () => {
    it('splits loan payment transactions in bulk', async () => {
      // Create a transaction with loan payment description (Finnish bank format)
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Bank',
          receiver: 'Loan Account',
          description: 'Lyhennys 500,00 euroa Korko 50,00 euroa Jäljellä 10000,00 euroa',
          transactionDate: new Date('2024-01-24'),
          accountingDate: new Date('2024-01-24'),
          amount: -550,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          externalId: `loan-bulk-${Date.now()}`,
        },
      );

      const response = await request(server)
        .post('/accounting/transaction/split-loan-payment')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          ids: [transaction.id],
          principalExpenseTypeId: 1,
          interestExpenseTypeId: 2,
        })
        .expect(201);

      expect(response.body).toHaveProperty('allSuccess');
      expect(response.body).toHaveProperty('results');
    });

    it('returns 400 when no ids provided', async () => {
      await request(server)
        .post('/accounting/transaction/split-loan-payment')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          ids: [],
          principalExpenseTypeId: 1,
          interestExpenseTypeId: 2,
        })
        .expect(400);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/accounting/transaction/split-loan-payment')
        .send({
          ids: [1],
          principalExpenseTypeId: 1,
          interestExpenseTypeId: 2,
        })
        .expect(401);
    });
  });

  // ==========================================
  // 8. POST /:id/split-loan-payment - Single split
  // ==========================================
  describe('POST /accounting/transaction/:id/split-loan-payment', () => {
    it('splits a single loan payment transaction', async () => {
      // Create a transaction with loan payment description (Finnish bank format)
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Bank',
          receiver: 'Loan Account',
          description: 'Lyhennys 300,00 euroa Korko 30,00 euroa Jäljellä 5000,00 euroa',
          transactionDate: new Date('2024-01-25'),
          accountingDate: new Date('2024-01-25'),
          amount: -330,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          externalId: `loan-single-${Date.now()}`,
        },
      );

      const response = await request(server)
        .post(`/accounting/transaction/${transaction.id}/split-loan-payment`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          principalExpenseTypeId: 1,
          interestExpenseTypeId: 2,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe(TransactionType.EXPENSE);
    });

    it('returns 404 for non-existent transaction', async () => {
      await request(server)
        .post('/accounting/transaction/999999/split-loan-payment')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          principalExpenseTypeId: 1,
          interestExpenseTypeId: 2,
        })
        .expect(404);
    });

    it('returns 400 for non-loan payment description', async () => {
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Regular Sender',
          receiver: 'Regular Receiver',
          description: 'Regular payment',
          transactionDate: new Date('2024-01-26'),
          accountingDate: new Date('2024-01-26'),
          amount: -100,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          externalId: `non-loan-${Date.now()}`,
        },
      );

      await request(server)
        .post(`/accounting/transaction/${transaction.id}/split-loan-payment`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          principalExpenseTypeId: 1,
          interestExpenseTypeId: 2,
        })
        .expect(400);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/accounting/transaction/1/split-loan-payment')
        .send({
          principalExpenseTypeId: 1,
          interestExpenseTypeId: 2,
        })
        .expect(401);
    });
  });

  // ==========================================
  // 9. GET /accounting/transaction/:id - Find one
  // ==========================================
  describe('GET /accounting/transaction/:id', () => {
    it('returns a transaction by id', async () => {
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          ...getTransactionDeposit1(mainUser.properties[0].id),
          externalId: `get-one-${Date.now()}`,
        },
      );

      const response = await request(server)
        .get(`/accounting/transaction/${transaction.id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      expect(response.body.id).toBe(transaction.id);
      expect(response.body.description).toBe('Talletus');
    });

    it('returns 404 for non-existent transaction', async () => {
      await request(server)
        .get('/accounting/transaction/999999')
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });

    it('returns 401 when accessing another user\'s transaction', async () => {
      const user2 = testUsers.user2WithProperties;

      // Create transaction for user2
      const transaction = await addTransaction(
        app,
        user2.jwtUser,
        {
          ...getTransactionIncome1(user2.properties[0].id),
          externalId: `user2-get-${Date.now()}`,
        },
      );

      // Try to access as main user
      await request(server)
        .get(`/accounting/transaction/${transaction.id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(401);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .get('/accounting/transaction/1')
        .expect(401);
    });
  });

  // ==========================================
  // 10. PUT /accounting/transaction/:id - Update
  // ==========================================
  describe('PUT /accounting/transaction/:id', () => {
    it('updates a pending transaction successfully', async () => {
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Original Sender',
          receiver: 'Original Receiver',
          description: 'Original description',
          transactionDate: new Date('2024-01-27'),
          accountingDate: new Date('2024-01-27'),
          amount: -50,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.EXPENSE,
          externalId: `update-test-${Date.now()}`,
        },
      );

      await request(server)
        .put(`/accounting/transaction/${transaction.id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          sender: 'Updated Sender',
          receiver: 'Updated Receiver',
          description: 'Updated description',
          transactionDate: new Date('2024-01-27'),
          accountingDate: new Date('2024-01-27'),
          amount: -75,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.EXPENSE,
        })
        .expect(200);

      // Response body can be true or empty object depending on NestJS serialization
      // The important thing is that the request succeeded (200 status)

      // Verify the update
      const verifyResponse = await request(server)
        .get(`/accounting/transaction/${transaction.id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      expect(verifyResponse.body.description).toBe('Updated description');
    });

    it('returns 400 when updating accepted transaction', async () => {
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          ...getTransactionExpense1(mainUser.properties[0].id, TransactionStatus.ACCEPTED),
          externalId: `update-accepted-${Date.now()}`,
        },
      );

      await request(server)
        .put(`/accounting/transaction/${transaction.id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          sender: 'Updated Sender',
          receiver: 'Updated Receiver',
          description: 'Updated description',
          transactionDate: new Date('2024-01-28'),
          accountingDate: new Date('2024-01-28'),
          amount: -100,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.EXPENSE,
        })
        .expect(400);
    });

    it('returns 404 for non-existent transaction', async () => {
      await request(server)
        .put('/accounting/transaction/999999')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          sender: 'Sender',
          receiver: 'Receiver',
          description: 'Description',
          transactionDate: new Date(),
          accountingDate: new Date(),
          amount: -50,
          propertyId: mainUser.properties[0].id,
        })
        .expect(404);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .put('/accounting/transaction/1')
        .send({})
        .expect(401);
    });
  });

  // ==========================================
  // 11. DELETE /accounting/transaction/:id - Delete single
  // ==========================================
  describe('DELETE /accounting/transaction/:id', () => {
    it('deletes a transaction successfully', async () => {
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'To Delete',
          receiver: 'To Delete',
          description: 'Transaction to delete',
          transactionDate: new Date('2024-01-29'),
          accountingDate: new Date('2024-01-29'),
          amount: -25,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.EXPENSE,
          externalId: `delete-single-${Date.now()}`,
        },
      );

      await request(server)
        .delete(`/accounting/transaction/${transaction.id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      // Verify deletion
      await request(server)
        .get(`/accounting/transaction/${transaction.id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });

    it('returns 404 for non-existent transaction', async () => {
      await request(server)
        .delete('/accounting/transaction/999999')
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });

    it('returns 401 when deleting another user\'s transaction', async () => {
      const user2 = testUsers.user2WithProperties;

      const transaction = await addTransaction(
        app,
        user2.jwtUser,
        {
          sender: 'User2 Sender',
          receiver: 'User2 Receiver',
          description: 'User2 transaction',
          transactionDate: new Date('2024-01-30'),
          accountingDate: new Date('2024-01-30'),
          amount: -50,
          propertyId: user2.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.EXPENSE,
          externalId: `user2-delete-${Date.now()}`,
        },
      );

      await request(server)
        .delete(`/accounting/transaction/${transaction.id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(401);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .delete('/accounting/transaction/1')
        .expect(401);
    });

    it('deletes related expenses and incomes when transaction is deleted', async () => {
      // Create a transaction with expenses via HTTP
      const createResponse = await request(server)
        .post('/accounting/transaction')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          sender: 'Cascade Delete Sender',
          receiver: 'Cascade Delete Receiver',
          description: 'Transaction with expenses to cascade delete',
          transactionDate: new Date('2024-02-10'),
          accountingDate: new Date('2024-02-10'),
          amount: -150,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.EXPENSE,
          externalId: `cascade-expense-${Date.now()}`,
          expenses: [
            {
              expenseTypeId: 1,
              description: 'Expense row 1',
              amount: 100,
              quantity: 1,
              totalAmount: 100,
            },
            {
              expenseTypeId: 1,
              description: 'Expense row 2',
              amount: 50,
              quantity: 1,
              totalAmount: 50,
            },
          ],
        })
        .expect(201);

      const transactionId = createResponse.body.id;

      // Verify expenses were created by fetching transaction with relations
      const searchBefore = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          where: { id: transactionId },
          relations: { expenses: true },
        })
        .expect(200);

      expect(searchBefore.body.length).toBe(1);
      expect(searchBefore.body[0].expenses.length).toBe(2);
      const expenseIds = searchBefore.body[0].expenses.map((e: { id: number }) => e.id);

      // Delete the transaction
      await request(server)
        .delete(`/accounting/transaction/${transactionId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      // Verify transaction is deleted
      await request(server)
        .get(`/accounting/transaction/${transactionId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);

      // Verify expenses are also deleted (not just orphaned)
      // Search expenses by their IDs - they should not exist anymore
      const searchExpensesAfter = await request(server)
        .post('/accounting/expense/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          where: { id: { $in: expenseIds } },
        })
        .expect(200);

      expect(searchExpensesAfter.body.length).toBe(0);
    });

    it('deletes related incomes when transaction is deleted', async () => {
      // Create a transaction with incomes via HTTP
      const createResponse = await request(server)
        .post('/accounting/transaction')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          sender: 'Income Cascade Sender',
          receiver: 'Income Cascade Receiver',
          description: 'Transaction with incomes to cascade delete',
          transactionDate: new Date('2024-02-11'),
          accountingDate: new Date('2024-02-11'),
          amount: 200,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.PENDING,
          type: TransactionType.INCOME,
          externalId: `cascade-income-${Date.now()}`,
          incomes: [
            {
              incomeTypeId: 1,
              description: 'Income row 1',
              amount: 200,
              quantity: 1,
              totalAmount: 200,
            },
          ],
        })
        .expect(201);

      const transactionId = createResponse.body.id;

      // Verify incomes were created by fetching transaction with relations
      const searchBefore = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          where: { id: transactionId },
          relations: { incomes: true },
        })
        .expect(200);

      expect(searchBefore.body.length).toBe(1);
      expect(searchBefore.body[0].incomes.length).toBe(1);
      const incomeIds = searchBefore.body[0].incomes.map((i: { id: number }) => i.id);

      // Delete the transaction
      await request(server)
        .delete(`/accounting/transaction/${transactionId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      // Verify incomes are also deleted
      const searchIncomesAfter = await request(server)
        .post('/accounting/income/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          where: { id: { $in: incomeIds } },
        })
        .expect(200);

      expect(searchIncomesAfter.body.length).toBe(0);
    });
  });

  // ==========================================
  // 12. POST /accounting/transaction/delete - Bulk delete
  // ==========================================
  describe('POST /accounting/transaction/delete', () => {
    it('deletes transactions successfully when user has ownership', async () => {
      // Create some transactions to delete
      const transaction1 = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Bulk Delete 1',
          receiver: 'Bulk Delete 1',
          description: 'Bulk delete transaction 1',
          transactionDate: new Date('2024-01-31'),
          accountingDate: new Date('2024-01-31'),
          amount: -10,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.ACCEPTED,
          type: TransactionType.EXPENSE,
          externalId: `bulk-delete-1-${Date.now()}`,
        },
      );

      const transaction2 = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Bulk Delete 2',
          receiver: 'Bulk Delete 2',
          description: 'Bulk delete transaction 2',
          transactionDate: new Date('2024-01-31'),
          accountingDate: new Date('2024-01-31'),
          amount: -20,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.ACCEPTED,
          type: TransactionType.EXPENSE,
          externalId: `bulk-delete-2-${Date.now()}`,
        },
      );

      const transactionIds = [transaction1.id, transaction2.id];

      const deleteResponse = await request(server)
        .post('/accounting/transaction/delete')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: transactionIds })
        .expect(201);

      expect(deleteResponse.body.allSuccess).toBe(true);
      expect(deleteResponse.body.results).toHaveLength(transactionIds.length);

      // Verify transactions are deleted
      const verifyResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          where: {
            id: { $in: transactionIds },
          },
        })
        .expect(200);

      expect(verifyResponse.body.length).toBe(0);
    });

    it('returns 400 when no ids provided', async () => {
      await request(server)
        .post('/accounting/transaction/delete')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [] })
        .expect(400);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/accounting/transaction/delete')
        .send({ ids: [1, 2, 3] })
        .expect(401);
    });

    it('returns unauthorized status for transactions user does not own', async () => {
      const user2 = testUsers.user2WithProperties;

      // Create user2's transaction
      const transaction = await addTransaction(
        app,
        user2.jwtUser,
        {
          sender: 'User2 Bulk',
          receiver: 'User2 Bulk',
          description: 'User2 bulk delete test',
          transactionDate: new Date('2024-02-01'),
          accountingDate: new Date('2024-02-01'),
          amount: -30,
          propertyId: user2.properties[0].id,
          status: TransactionStatus.ACCEPTED,
          type: TransactionType.EXPENSE,
          externalId: `user2-bulk-${Date.now()}`,
        },
      );

      // Try to delete user2's transaction as main user
      const deleteResponse = await request(server)
        .post('/accounting/transaction/delete')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [transaction.id] })
        .expect(201);

      expect(deleteResponse.body.allSuccess).toBe(false);
      expect(deleteResponse.body.results).toHaveLength(1);
      expect(deleteResponse.body.results[0].statusCode).toBe(401);
    });

    it('handles mixed ownership - deletes only owned transactions', async () => {
      const user2 = testUsers.user2WithProperties;

      // Create transaction for main user
      const mainUserTransaction = await addTransaction(
        app,
        mainUser.jwtUser,
        {
          sender: 'Main User Mixed',
          receiver: 'Main User Mixed',
          description: 'Main user mixed delete test',
          transactionDate: new Date('2024-02-02'),
          accountingDate: new Date('2024-02-02'),
          amount: -40,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.ACCEPTED,
          type: TransactionType.EXPENSE,
          externalId: `main-mixed-${Date.now()}`,
        },
      );

      // Create transaction for user2
      const user2Transaction = await addTransaction(
        app,
        user2.jwtUser,
        {
          sender: 'User2 Mixed',
          receiver: 'User2 Mixed',
          description: 'User2 mixed delete test',
          transactionDate: new Date('2024-02-02'),
          accountingDate: new Date('2024-02-02'),
          amount: -50,
          propertyId: user2.properties[0].id,
          status: TransactionStatus.ACCEPTED,
          type: TransactionType.EXPENSE,
          externalId: `user2-mixed-${Date.now()}`,
        },
      );

      // Try to delete both as main user
      const deleteResponse = await request(server)
        .post('/accounting/transaction/delete')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [mainUserTransaction.id, user2Transaction.id] })
        .expect(201);

      expect(deleteResponse.body.allSuccess).toBe(false);
      expect(deleteResponse.body.results).toHaveLength(2);

      // One should succeed, one should fail
      const successResults = deleteResponse.body.results.filter(
        (r: { statusCode: number }) => r.statusCode === 200,
      );
      const failResults = deleteResponse.body.results.filter(
        (r: { statusCode: number }) => r.statusCode === 401,
      );

      expect(successResults).toHaveLength(1);
      expect(failResults).toHaveLength(1);
    });
  });
});
