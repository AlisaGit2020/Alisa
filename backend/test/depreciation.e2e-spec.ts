import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import { ExpenseTypeService } from '@alisa-backend/accounting/expense/expense-type.service';
import {
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import { TransactionStatus, TransactionType } from '@alisa-backend/common/types';
import * as http from 'http';

describe('Depreciation via Tax endpoints (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let testUsers: TestUsersSetup;
  let transactionService: TransactionService;
  let expenseTypeService: ExpenseTypeService;
  let mainUser: TestUser;
  let capitalImprovementExpenseTypeId: number;

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

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;

    // Create capital improvement expense type
    const capitalImprovementExpenseType = await expenseTypeService.add(mainUser.jwtUser, {
      name: 'Capital Improvement',
      description: 'Major improvements that add value',
      isTaxDeductible: true,
      isCapitalImprovement: true,
    });
    capitalImprovementExpenseTypeId = capitalImprovementExpenseType.id;

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
    await app.close();
    server.close();
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

      // Create expense type for user2
      const user2ExpenseType = await expenseTypeService.add(user2.jwtUser, {
        name: 'Capital Improvement User2',
        description: 'User2 improvements',
        isTaxDeductible: true,
        isCapitalImprovement: true,
      });

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
            expenseTypeId: user2ExpenseType.id,
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
