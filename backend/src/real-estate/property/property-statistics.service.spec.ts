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
  TestUser,
  TestUsersSetup,
} from 'test/helper-functions';
import { PropertyStatisticsService } from '@alisa-backend/real-estate/property/property-statistics.service';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';

describe('Property statistics service', () => {
  let app: INestApplication;

  let service: PropertyStatisticsService;
  let propertyService: PropertyService;
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

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainTestUser = testUsers.user1WithProperties;
    await addTransactionsToTestUsers(app, testUsers);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Calculate statistics', () => {
    it('it calculates statistics correctly', async () => {
      await service.calculateStatistics(mainTestUser.jwtUser, 1);

      const properties = await propertyService.search(mainTestUser.jwtUser, {
        relations: { statistics: true },
        where: { id: 1 },
      });
      const property = properties[0];
      expect(property.statistics.balance).toBe(1111.36);
    });
  });
});
