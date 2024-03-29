/*
Data service test
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import {
  addTransactionsToTestUsers,
  getTestUsers,
  prepareDatabase,
  sleep,
  TestUser,
  TestUsersSetup,
} from 'test/helper-functions';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import { getTransactionExpense1 } from '../../../test/data/mocks/transaction.mock';
import { StatisticKey } from '@alisa-backend/common/types';
import { PropertyStatisticsService } from '@alisa-backend/real-estate/property/property-statistics.service';
import { IsNull } from 'typeorm';

describe('Property statistics service', () => {
  let app: INestApplication;

  let service: PropertyStatisticsService;
  let propertyService: PropertyService;
  let transactionService: TransactionService;
  let testUsers: TestUsersSetup;
  let mainTestUser: TestUser;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<PropertyStatisticsService>(PropertyStatisticsService);
    propertyService = app.get<PropertyService>(PropertyService);
    transactionService = app.get<TransactionService>(TransactionService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainTestUser = testUsers.user1WithProperties;
    await addTransactionsToTestUsers(app, testUsers);
    await sleep(50);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Calculate statistics', () => {
    it.only('it calculates statistics correctly', async () => {
      const statistics = await service.search(mainTestUser.jwtUser, {
        where: {
          propertyId: 1,
          key: StatisticKey.BALANCE,
          year: 2023,
          month: IsNull(),
        },
      });
      const statistic = statistics[0];

      expect(statistic.value).toBe('2011.36');
    });

    it('it updates statistics when transaction amount updates', async () => {
      const input = getTransactionExpense1(1);
      input.amount = -100;

      await transactionService.update(mainTestUser.jwtUser, 1, input);
      await sleep(50);
      const properties = await propertyService.search(mainTestUser.jwtUser, {
        relations: { statistics: true },
        where: { id: 1 },
      });

      //expect(property.statistics.balance).toBe(1051);
    });

    it('it updates statistics when transaction is deleted', async () => {
      await transactionService.delete(mainTestUser.jwtUser, 1);
      await sleep(50);
      const properties = await propertyService.search(mainTestUser.jwtUser, {
        relations: { statistics: true },
        where: { id: 1 },
      });

      //expect(property.statistics.balance).toBe(1151);
    });
  });
});
