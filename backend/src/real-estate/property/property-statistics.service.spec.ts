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
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import {
  getTransactionExpense1,
  getTransactionIncome1,
} from '../../../test/data/mocks/transaction.mock';

describe('Property statistics service', () => {
  let app: INestApplication;

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

    propertyService = app.get<PropertyService>(PropertyService);
    transactionService = app.get<TransactionService>(TransactionService);

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
      const properties = await propertyService.search(mainTestUser.jwtUser, {
        relations: { statistics: true },
        where: { id: 1 },
      });
      const property = properties[0];
      expect(property.statistics.balance).toBe(1111.36);
    });

    it('it updates statistics when transaction amount updates', async () => {
      const input = getTransactionExpense1(1);
      input.amount = -100;

      await transactionService.update(mainTestUser.jwtUser, 1, input);

      const properties = await propertyService.search(mainTestUser.jwtUser, {
        relations: { statistics: true },
        where: { id: 1 },
      });
      const property = properties[0];
      expect(property.statistics.balance).toBe(1051);
    });

    it('it updates statistics when transaction is deleted', async () => {
      await transactionService.delete(mainTestUser.jwtUser, 1);

      const properties = await propertyService.search(mainTestUser.jwtUser, {
        relations: { statistics: true },
        where: { id: 1 },
      });
      const property = properties[0];
      expect(property.statistics.balance).toBe(1151);
    });
  });
});
