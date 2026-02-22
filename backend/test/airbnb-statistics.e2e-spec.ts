import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { EventTrackerService } from '@alisa-backend/common/event-tracker.service';
import {
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import { IncomeTypeKey, StatisticKey } from '@alisa-backend/common/types';
import { IncomeService } from '@alisa-backend/accounting/income/income.service';
import { IncomeTypeService } from '@alisa-backend/accounting/income/income-type.service';
import { IncomeInputDto } from '@alisa-backend/accounting/income/dtos/income-input.dto';
import * as http from 'http';

describe('AirbnbStatisticsService (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let eventTracker: EventTrackerService;
  let incomeService: IncomeService;
  let incomeTypeService: IncomeTypeService;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;
  let airbnbIncomeTypeId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    server = app.getHttpServer();

    authService = app.get(AuthService);
    eventTracker = app.get(EventTrackerService);
    incomeService = app.get(IncomeService);
    incomeTypeService = app.get(IncomeTypeService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;

    // Get the global Airbnb income type ID (seeded by DefaultsSeeder)
    const airbnbType = await incomeTypeService.findByKey(IncomeTypeKey.AIRBNB);
    airbnbIncomeTypeId = airbnbType.id;
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  const getUserAccessToken = async (user: TestUser): Promise<string> => {
    return authService.login(user.jwtUser);
  };

  const createAirbnbIncome = async (
    propertyId: number,
    amount: number,
    accountingDate: Date,
  ): Promise<number> => {
    const incomeInput: IncomeInputDto = {
      description: 'Airbnb booking',
      amount,
      quantity: 1,
      totalAmount: amount,
      incomeTypeId: airbnbIncomeTypeId,
      propertyId,
      accountingDate,
    };
    const income = await incomeService.add(mainUser.jwtUser, incomeInput);
    await eventTracker.waitForPending();
    return income.id;
  };

  const getStatistics = async (
    token: string,
    propertyId: number,
    key: StatisticKey,
    year?: number,
    month?: number,
  ): Promise<number> => {
    const body: Record<string, unknown> = { propertyId, key };
    if (year !== undefined) {
      body.year = year;
      body.includeYearly = true;
    }
    if (month !== undefined) {
      body.month = month;
      body.includeMonthly = true;
    }

    const response = await request(server)
      .post('/real-estate/property/statistics/search')
      .set('Authorization', getBearerToken(token))
      .send(body)
      .expect(200);

    // Return the numeric value, or 0 if no statistics found
    const stats = response.body;
    if (stats.length === 0) {
      return 0;
    }
    return parseInt(stats[0].value);
  };

  describe('Airbnb visits statistics', () => {
    it('creates AIRBNB_VISITS statistic when income with matching type is created', async () => {
      const token = await getUserAccessToken(mainUser);
      const propertyId = mainUser.properties[0].id;

      // Initially should have no visits
      const initialCount = await getStatistics(
        token,
        propertyId,
        StatisticKey.AIRBNB_VISITS,
      );
      expect(initialCount).toBe(0);

      // Create an Airbnb income
      await createAirbnbIncome(propertyId, 100, new Date('2024-03-15'));

      // Should now have 1 visit
      const count = await getStatistics(
        token,
        propertyId,
        StatisticKey.AIRBNB_VISITS,
      );
      expect(count).toBe(1);
    });

    it('increments visits count for each new income', async () => {
      const token = await getUserAccessToken(mainUser);
      const propertyId = mainUser.properties[1].id;

      // Create multiple Airbnb incomes
      await createAirbnbIncome(propertyId, 100, new Date('2024-04-10'));
      await createAirbnbIncome(propertyId, 150, new Date('2024-04-15'));
      await createAirbnbIncome(propertyId, 200, new Date('2024-04-20'));

      const count = await getStatistics(
        token,
        propertyId,
        StatisticKey.AIRBNB_VISITS,
      );
      expect(count).toBe(3);
    });

    it('tracks visits by month', async () => {
      const token = await getUserAccessToken(mainUser);
      const propertyId = mainUser.properties[1].id;

      // Check monthly stats for April 2024 (we added 3 incomes in April)
      const monthlyCount = await getStatistics(
        token,
        propertyId,
        StatisticKey.AIRBNB_VISITS,
        2024,
        4,
      );
      expect(monthlyCount).toBe(3);
    });

    it('tracks visits by year', async () => {
      const token = await getUserAccessToken(mainUser);
      const propertyId = mainUser.properties[1].id;

      // Check yearly stats for 2024
      const yearlyCount = await getStatistics(
        token,
        propertyId,
        StatisticKey.AIRBNB_VISITS,
        2024,
      );
      expect(yearlyCount).toBe(3);
    });

    it('decrements visits count when income is deleted', async () => {
      const token = await getUserAccessToken(mainUser);
      const propertyId = mainUser.properties[0].id;

      // Get current count
      const beforeCount = await getStatistics(
        token,
        propertyId,
        StatisticKey.AIRBNB_VISITS,
      );

      // Create and then delete an income
      const incomeId = await createAirbnbIncome(
        propertyId,
        100,
        new Date('2024-05-01'),
      );

      // Verify it increased
      const afterAddCount = await getStatistics(
        token,
        propertyId,
        StatisticKey.AIRBNB_VISITS,
      );
      expect(afterAddCount).toBe(beforeCount + 1);

      // Delete the income
      await incomeService.delete(mainUser.jwtUser, incomeId);
      await eventTracker.waitForPending();

      // Should be back to original count
      const afterDeleteCount = await getStatistics(
        token,
        propertyId,
        StatisticKey.AIRBNB_VISITS,
      );
      expect(afterDeleteCount).toBe(beforeCount);
    });

    it('does not count income with non-airbnb type', async () => {
      const token = await getUserAccessToken(mainUser);
      const propertyId = mainUser.properties[0].id;

      // Get current count
      const beforeCount = await getStatistics(
        token,
        propertyId,
        StatisticKey.AIRBNB_VISITS,
      );

      // Get a non-airbnb income type (rental)
      const rentalType = await incomeTypeService.findByKey(IncomeTypeKey.RENTAL);

      // Create income with a different income type
      const nonAirbnbIncome: IncomeInputDto = {
        description: 'Regular rental income',
        amount: 500,
        quantity: 1,
        totalAmount: 500,
        incomeTypeId: rentalType.id,
        propertyId,
        accountingDate: new Date('2024-06-01'),
      };
      await incomeService.add(mainUser.jwtUser, nonAirbnbIncome);
      await eventTracker.waitForPending();

      // Should still have same count
      const afterCount = await getStatistics(
        token,
        propertyId,
        StatisticKey.AIRBNB_VISITS,
      );
      expect(afterCount).toBe(beforeCount);
    });
  });
});
