import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@asset-backend/auth/auth.service';
import {
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUsersSetup,
} from './helper-functions';
import { ExpenseTypeKey, IncomeTypeKey } from '@asset-backend/common/types';
import * as http from 'http';

describe('Type Seeding (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let testUsers: TestUsersSetup;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    server = app.getHttpServer();

    authService = app.get(AuthService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    userToken = await getUserAccessToken2(
      authService,
      testUsers.user1WithProperties.jwtUser,
    );
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe('Expense Types', () => {
    it('should have all ExpenseTypeKey enum values seeded in the database', async () => {
      const response = await request(server)
        .post('/accounting/expense/type/search')
        .set('Authorization', getBearerToken(userToken))
        .send({})
        .expect(200);

      const expenseTypes = response.body;
      const seededKeys = expenseTypes.map((type: { key: string }) => type.key);

      // Get all enum values
      const allExpenseTypeKeys = Object.values(ExpenseTypeKey);

      // Verify all enum keys are seeded
      for (const key of allExpenseTypeKeys) {
        expect(seededKeys).toContain(key);
      }

      // Verify counts match (no extra types in DB)
      expect(seededKeys.length).toBe(allExpenseTypeKeys.length);
    });

    it('should have correct structure for each expense type', async () => {
      const response = await request(server)
        .post('/accounting/expense/type/search')
        .set('Authorization', getBearerToken(userToken))
        .send({})
        .expect(200);

      const expenseTypes = response.body;

      for (const type of expenseTypes) {
        expect(type).toHaveProperty('id');
        expect(type).toHaveProperty('key');
        expect(type).toHaveProperty('isTaxDeductible');
        expect(type).toHaveProperty('isCapitalImprovement');
        expect(typeof type.id).toBe('number');
        expect(typeof type.key).toBe('string');
        expect(typeof type.isTaxDeductible).toBe('boolean');
        expect(typeof type.isCapitalImprovement).toBe('boolean');
      }
    });
  });

  describe('Income Types', () => {
    it('should have all IncomeTypeKey enum values seeded in the database', async () => {
      const response = await request(server)
        .post('/accounting/income/type/search')
        .set('Authorization', getBearerToken(userToken))
        .send({})
        .expect(200);

      const incomeTypes = response.body;
      const seededKeys = incomeTypes.map((type: { key: string }) => type.key);

      // Get all enum values
      const allIncomeTypeKeys = Object.values(IncomeTypeKey);

      // Verify all enum keys are seeded
      for (const key of allIncomeTypeKeys) {
        expect(seededKeys).toContain(key);
      }

      // Verify counts match (no extra types in DB)
      expect(seededKeys.length).toBe(allIncomeTypeKeys.length);
    });

    it('should have correct structure for each income type', async () => {
      const response = await request(server)
        .post('/accounting/income/type/search')
        .set('Authorization', getBearerToken(userToken))
        .send({})
        .expect(200);

      const incomeTypes = response.body;

      for (const type of incomeTypes) {
        expect(type).toHaveProperty('id');
        expect(type).toHaveProperty('key');
        expect(type).toHaveProperty('isTaxable');
        expect(typeof type.id).toBe('number');
        expect(typeof type.key).toBe('string');
        expect(typeof type.isTaxable).toBe('boolean');
      }
    });
  });
});
