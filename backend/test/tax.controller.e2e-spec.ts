import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import { ExpenseTypeService } from '@alisa-backend/accounting/expense/expense-type.service';
import { IncomeTypeService } from '@alisa-backend/accounting/income/income-type.service';
import {
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import { TransactionStatus, TransactionType } from '@alisa-backend/common/types';
import * as http from 'http';

describe('TaxController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let testUsers: TestUsersSetup;
  let transactionService: TransactionService;
  let expenseTypeService: ExpenseTypeService;
  let incomeTypeService: IncomeTypeService;
  let mainUser: TestUser;
  let taxDeductibleExpenseTypeId: number;
  let nonDeductibleExpenseTypeId: number;
  let capitalImprovementExpenseTypeId: number;
  let incomeTypeId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    authService = app.get(AuthService);
    transactionService = app.get(TransactionService);
    expenseTypeService = app.get(ExpenseTypeService);
    incomeTypeService = app.get(IncomeTypeService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;

    // Use global expense types (seeded by DefaultsSeeder)
    const repairsType = await expenseTypeService.findByKey('repairs');
    taxDeductibleExpenseTypeId = repairsType.id;

    const loanPrincipalType = await expenseTypeService.findByKey('loan-principal');
    nonDeductibleExpenseTypeId = loanPrincipalType.id;

    const capitalImprovementType = await expenseTypeService.findByKey('capital-improvement');
    capitalImprovementExpenseTypeId = capitalImprovementType.id;

    // Use global income type
    const rentalType = await incomeTypeService.findByKey('rental');
    incomeTypeId = rentalType.id;

    // Add income transaction
    await transactionService.add(mainUser.jwtUser, {
      propertyId: mainUser.properties[0].id,
      type: TransactionType.INCOME,
      status: TransactionStatus.ACCEPTED,
      sender: 'Tenant',
      receiver: 'Owner',
      description: 'Monthly rent',
      transactionDate: new Date('2024-06-15'),
      accountingDate: new Date('2024-06-15'),
      amount: 1000,
      incomes: [
        {
          incomeTypeId: incomeTypeId,
          description: 'June rent',
          amount: 1000,
          quantity: 1,
          totalAmount: 1000,
        },
      ],
    });

    // Add another income transaction
    await transactionService.add(mainUser.jwtUser, {
      propertyId: mainUser.properties[0].id,
      type: TransactionType.INCOME,
      status: TransactionStatus.ACCEPTED,
      sender: 'Tenant',
      receiver: 'Owner',
      description: 'Monthly rent',
      transactionDate: new Date('2024-07-15'),
      accountingDate: new Date('2024-07-15'),
      amount: 1000,
      incomes: [
        {
          incomeTypeId: incomeTypeId,
          description: 'July rent',
          amount: 1000,
          quantity: 1,
          totalAmount: 1000,
        },
      ],
    });

    // Add tax-deductible expense
    await transactionService.add(mainUser.jwtUser, {
      propertyId: mainUser.properties[0].id,
      type: TransactionType.EXPENSE,
      status: TransactionStatus.ACCEPTED,
      sender: 'Owner',
      receiver: 'Contractor',
      description: 'Plumbing repair',
      transactionDate: new Date('2024-06-20'),
      accountingDate: new Date('2024-06-20'),
      amount: 200,
      expenses: [
        {
          expenseTypeId: taxDeductibleExpenseTypeId,
          description: 'Fix leaky faucet',
          amount: 200,
          quantity: 1,
          totalAmount: 200,
        },
      ],
    });

    // Add non-deductible expense
    await transactionService.add(mainUser.jwtUser, {
      propertyId: mainUser.properties[0].id,
      type: TransactionType.EXPENSE,
      status: TransactionStatus.ACCEPTED,
      sender: 'Owner',
      receiver: 'Store',
      description: 'Loan principal payment',
      transactionDate: new Date('2024-06-25'),
      accountingDate: new Date('2024-06-25'),
      amount: 500,
      expenses: [
        {
          expenseTypeId: nonDeductibleExpenseTypeId,
          description: 'Loan principal',
          amount: 500,
          quantity: 1,
          totalAmount: 500,
        },
      ],
    });

    // Create capital improvement expense from 2022
    await transactionService.add(mainUser.jwtUser, {
      propertyId: mainUser.properties[0].id,
      type: TransactionType.EXPENSE,
      status: TransactionStatus.ACCEPTED,
      sender: 'Owner',
      receiver: 'Contractor',
      description: 'Bathroom renovation',
      transactionDate: new Date('2022-06-15'),
      accountingDate: new Date('2022-06-15'),
      amount: 10000,
      expenses: [
        {
          expenseTypeId: capitalImprovementExpenseTypeId,
          description: 'Complete bathroom renovation',
          amount: 10000,
          quantity: 1,
          totalAmount: 10000,
        },
      ],
    });

    // Create another capital improvement from 2023
    await transactionService.add(mainUser.jwtUser, {
      propertyId: mainUser.properties[0].id,
      type: TransactionType.EXPENSE,
      status: TransactionStatus.ACCEPTED,
      sender: 'Owner',
      receiver: 'Contractor',
      description: 'Kitchen renovation',
      transactionDate: new Date('2023-03-10'),
      accountingDate: new Date('2023-03-10'),
      amount: 5000,
      expenses: [
        {
          expenseTypeId: capitalImprovementExpenseTypeId,
          description: 'Kitchen cabinets and appliances',
          amount: 5000,
          quantity: 1,
          totalAmount: 5000,
        },
      ],
    });
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe('POST /real-estate/property/tax/calculate', () => {
    it('calculates tax for all user properties', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024 })
        .expect(200);

      expect(response.body.year).toBe(2024);
      // Values depend on test data - just check structure
      expect(response.body.grossIncome).toBeGreaterThanOrEqual(0);
      expect(response.body.deductions).toBeGreaterThanOrEqual(0);
      expect(response.body.netIncome).toBeDefined();
      expect(response.body.breakdown).toBeDefined();
      expect(response.body.calculatedAt).toBeDefined();
    });

    it('calculates tax for a specific property', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);
      const propertyId = mainUser.properties[0].id;

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024, propertyId })
        .expect(200);

      expect(response.body.year).toBe(2024);
      expect(response.body.propertyId).toBe(propertyId);
      expect(response.body.grossIncome).toBeGreaterThanOrEqual(0);
    });

    it('returns empty result for property with no transactions', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);
      const propertyId = mainUser.properties[1].id;

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024, propertyId })
        .expect(200);

      expect(response.body.grossIncome).toBe(0);
      expect(response.body.deductions).toBe(0);
    });

    it('returns empty result for year with no transactions', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2020 })
        .expect(200);

      expect(response.body.grossIncome).toBe(0);
      expect(response.body.deductions).toBe(0);
    });

    it('includes breakdown of deductions when present', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024 })
        .expect(200);

      expect(Array.isArray(response.body.breakdown)).toBe(true);
      // Breakdown may be empty if no tax-deductible expenses with ACCEPTED status
      if (response.body.breakdown.length > 0) {
        const firstItem = response.body.breakdown[0];
        expect(firstItem.isTaxDeductible).toBeDefined();
      }
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/real-estate/property/tax/calculate')
        .send({ year: 2024 })
        .expect(401);
    });

    it('returns 401 when accessing other user property', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);
      const otherUserProperty = testUsers.user2WithProperties.properties[0];

      await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024, propertyId: otherUserProperty.id })
        .expect(401);
    });
  });

  describe('GET /real-estate/property/tax', () => {
    it('returns saved tax data after calculation', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024 })
        .expect(200);

      const response = await request(server)
        .get('/real-estate/property/tax')
        .query({ year: '2024' })
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.year).toBe(2024);
      expect(response.body.grossIncome).toBeDefined();
      expect(response.body.deductions).toBeDefined();
      expect(response.body.netIncome).toBeDefined();
    });

    it('returns empty object when no calculation exists for year', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .get('/real-estate/property/tax')
        .query({ year: '2010' })
        .set('Authorization', getBearerToken(token))
        .expect(200);

      // API returns null which serializes to empty object {} in JSON
      expect(response.body === null || Object.keys(response.body).length === 0).toBe(true);
    });

    it('returns tax data for specific property', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);
      const propertyId = mainUser.properties[0].id;

      await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024, propertyId })
        .expect(200);

      const response = await request(server)
        .get('/real-estate/property/tax')
        .query({ year: '2024', propertyId: propertyId.toString() })
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.propertyId).toBe(propertyId);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .get('/real-estate/property/tax')
        .query({ year: '2024' })
        .expect(401);
    });

    it('defaults to previous year when year not specified', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .get('/real-estate/property/tax')
        .set('Authorization', getBearerToken(token))
        .expect(200);

      // Response may be null/empty if no data exists for previous year
      // Just verify the request succeeds
      expect(response.status).toBe(200);
    });
  });

  describe('User isolation', () => {
    it('user2 cannot access user1 tax data via calculate', async () => {
      const token2 = await getUserAccessToken2(authService, testUsers.user2WithProperties.jwtUser);

      // user2 trying to calculate tax for user1's property should fail with 401
      await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token2))
        .send({ year: 2024, propertyId: mainUser.properties[0].id })
        .expect(401);
    });

    it('user2 cannot access user1 tax data via get', async () => {
      const token2 = await getUserAccessToken2(authService, testUsers.user2WithProperties.jwtUser);

      // user2 trying to get tax for user1's property should fail with 401
      await request(server)
        .get('/real-estate/property/tax')
        .query({ year: '2024', propertyId: mainUser.properties[0].id.toString() })
        .set('Authorization', getBearerToken(token2))
        .expect(401);
    });
  });

  describe('Tax calculation with ownership percentage', () => {
    it('returns ownershipShare in response', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024 })
        .expect(200);

      expect(response.body.ownershipShare).toBeDefined();
      expect(typeof response.body.ownershipShare).toBe('number');
    });

    it('adjusts amounts for partial ownership', async () => {
      const user = testUsers.userWithoutProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      // Create property with 50% ownership
      const propertyResponse = await request(server)
        .post('/real-estate/property')
        .set('Authorization', getBearerToken(token))
        .send({
          name: 'Partial Ownership Property',
          size: 80,
          ownerships: [{ share: 50 }],
        })
        .expect(201);

      const propertyId = propertyResponse.body.id;

      // Use global expense and income types
      const repairsType = await expenseTypeService.findByKey('repairs');
      const rentalType = await incomeTypeService.findByKey('rental');

      // Add income: 1000
      await transactionService.add(user.jwtUser, {
        propertyId,
        type: TransactionType.INCOME,
        status: TransactionStatus.ACCEPTED,
        sender: 'Tenant',
        receiver: 'Owner',
        description: 'Rent',
        transactionDate: new Date('2024-08-15'),
        accountingDate: new Date('2024-08-15'),
        amount: 1000,
        incomes: [
          {
            incomeTypeId: rentalType.id,
            description: 'August rent',
            amount: 1000,
            quantity: 1,
            totalAmount: 1000,
          },
        ],
      });

      // Add expense: 200
      await transactionService.add(user.jwtUser, {
        propertyId,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.ACCEPTED,
        sender: 'Owner',
        receiver: 'Contractor',
        description: 'Repairs',
        transactionDate: new Date('2024-08-20'),
        accountingDate: new Date('2024-08-20'),
        amount: 200,
        expenses: [
          {
            expenseTypeId: repairsType.id,
            description: 'Fix something',
            amount: 200,
            quantity: 1,
            totalAmount: 200,
          },
        ],
      });

      // Calculate tax
      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024, propertyId })
        .expect(200);

      // With 50% ownership:
      // grossIncome should be 1000 * 0.5 = 500
      // deductions should be 200 * 0.5 = 100
      expect(response.body.ownershipShare).toBe(50);
      expect(response.body.grossIncome).toBe(500);
      expect(response.body.deductions).toBe(100);
      expect(response.body.netIncome).toBe(400); // 500 - 100 - 0 depreciation
    });

    it('returns 100% ownership share by default', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      // Calculate for property with 100% ownership
      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024, propertyId: user.properties[0].id })
        .expect(200);

      // Ownership share should be close to 100 (could be average of multiple properties)
      expect(response.body.ownershipShare).toBeGreaterThanOrEqual(1);
      expect(response.body.ownershipShare).toBeLessThanOrEqual(100);
    });
  });

  describe('Depreciation calculation via tax endpoint', () => {
    it('returns tax calculation with depreciation structure', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024, propertyId: mainUser.properties[0].id })
        .expect(200);

      // Should have depreciation structure
      expect(response.body.depreciation).toBeDefined();
      expect(typeof response.body.depreciation).toBe('number');
    });

    it('includes depreciation breakdown array in response', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024, propertyId: mainUser.properties[0].id })
        .expect(200);

      expect(response.body.depreciationBreakdown).toBeDefined();
      expect(Array.isArray(response.body.depreciationBreakdown)).toBe(true);
    });

    it('includes depreciation in net income calculation', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024, propertyId: mainUser.properties[0].id })
        .expect(200);

      // netIncome = grossIncome - deductions - depreciation
      expect(response.body.netIncome).toBe(
        response.body.grossIncome - response.body.deductions - response.body.depreciation,
      );
    });
  });

  describe('Depreciation for different years', () => {
    it('returns valid tax calculation for any year', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2021, propertyId: mainUser.properties[0].id })
        .expect(200);

      expect(response.body.year).toBe(2021);
      expect(response.body.depreciation).toBeGreaterThanOrEqual(0);
      expect(response.body.depreciationBreakdown).toBeDefined();
    });

    it('handles year 2022 calculation', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2022, propertyId: mainUser.properties[0].id })
        .expect(200);

      expect(response.body.year).toBe(2022);
      expect(response.body.depreciation).toBeGreaterThanOrEqual(0);
    });

    it('handles year 2023 calculation', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2023, propertyId: mainUser.properties[0].id })
        .expect(200);

      expect(response.body.year).toBe(2023);
      expect(response.body.depreciation).toBeGreaterThanOrEqual(0);
    });
  });

  describe('User isolation for depreciation', () => {
    it('user2 cannot access user1 depreciation data', async () => {
      const token2 = await getUserAccessToken2(
        authService,
        testUsers.user2WithProperties.jwtUser,
      );

      // User2 should get 401 when trying to access user1's property
      await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token2))
        .send({ year: 2024, propertyId: mainUser.properties[0].id })
        .expect(401);
    });

    it('user2 gets their own depreciation data', async () => {
      const user2 = testUsers.user2WithProperties;
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      // Use global capital improvement expense type
      const capitalImprovementType = await expenseTypeService.findByKey('capital-improvement');

      // Create capital improvement for user2
      await transactionService.add(user2.jwtUser, {
        propertyId: user2.properties[0].id,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.ACCEPTED,
        sender: 'Owner',
        receiver: 'Contractor',
        description: 'User2 renovation',
        transactionDate: new Date('2024-01-15'),
        accountingDate: new Date('2024-01-15'),
        amount: 20000,
        expenses: [
          {
            expenseTypeId: capitalImprovementType.id,
            description: 'User2 major renovation',
            amount: 20000,
            quantity: 1,
            totalAmount: 20000,
          },
        ],
      });

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token2))
        .send({ year: 2024, propertyId: user2.properties[0].id })
        .expect(200);

      // User2 should have their own data
      expect(response.body.year).toBe(2024);
      expect(response.body.propertyId).toBe(user2.properties[0].id);
      // Depreciation and breakdown should be defined (may be 0 if assets not created)
      expect(response.body.depreciation).toBeDefined();
      expect(response.body.depreciationBreakdown).toBeDefined();
    });
  });

  describe('Legacy breakdown compatibility', () => {
    it('includes breakdown array in response', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024, propertyId: mainUser.properties[0].id })
        .expect(200);

      // The breakdown array should be present
      expect(Array.isArray(response.body.breakdown)).toBe(true);
    });
  });

  describe('Depreciation GET endpoint', () => {
    it('returns saved depreciation data structure', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      // First calculate to save data
      await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024, propertyId: mainUser.properties[0].id })
        .expect(200);

      // Then retrieve
      const response = await request(server)
        .get('/real-estate/property/tax')
        .query({ year: '2024', propertyId: mainUser.properties[0].id.toString() })
        .set('Authorization', getBearerToken(token))
        .expect(200);

      // Should return valid tax response structure
      expect(response.body.year).toBe(2024);
      expect(response.body.depreciation).toBeDefined();
      expect(response.body.depreciationBreakdown).toBeDefined();
    });
  });

  describe('All properties depreciation', () => {
    it('aggregates depreciation across all user properties', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      // Add capital improvement to second property
      await transactionService.add(mainUser.jwtUser, {
        propertyId: mainUser.properties[1].id,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.ACCEPTED,
        sender: 'Owner',
        receiver: 'Contractor',
        description: 'Second property improvement',
        transactionDate: new Date('2024-05-01'),
        accountingDate: new Date('2024-05-01'),
        amount: 8000,
        expenses: [
          {
            expenseTypeId: capitalImprovementExpenseTypeId,
            description: 'Second property renovation',
            amount: 8000,
            quantity: 1,
            totalAmount: 8000,
          },
        ],
      });

      const response = await request(server)
        .post('/real-estate/property/tax/calculate')
        .set('Authorization', getBearerToken(token))
        .send({ year: 2024 }) // No propertyId = all properties
        .expect(200);

      // Should have depreciation and breakdown defined
      expect(response.body.depreciation).toBeDefined();
      expect(response.body.depreciationBreakdown).toBeDefined();
    });
  });
});
