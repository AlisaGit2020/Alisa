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
import { OpImportInput } from './dtos/op-import-input.dto';

import {
  getTestUsers,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from '../../../test/helper-functions';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import { TransactionType } from '@alisa-backend/common/types';

describe('OpImport service', () => {
  let service: OpImportService;
  let app: INestApplication;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;

  const opImportInput: OpImportInput = {
    file: `${MOCKS_PATH}/import/op.transactions.csv`,
    propertyId: 1,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<OpImportService>(OpImportService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('importCsv', () => {
    let transactionService: TransactionService;

    beforeAll(async () => {
      transactionService = app.get<TransactionService>(TransactionService);

      //Do the import
      await service.importCsv(mainUser.jwtUser, opImportInput);
    });

    it('imports transactions from CSV', async () => {
      const transactions = await transactionService.search(mainUser.jwtUser, {
        where: { propertyId: opImportInput.propertyId },
      });

      // CSV file has 20 rows (7 expenses + 13 incomes)
      expect(transactions.length).toBe(20);
    });

    it('imports transactions with type UNKNOWN', async () => {
      const transactions = await transactionService.search(mainUser.jwtUser, {
        where: { propertyId: opImportInput.propertyId },
      });

      transactions.forEach((transaction) => {
        expect(transaction.type).toBe(TransactionType.UNKNOWN);
      });
    });

    it('does not add duplicates', async () => {
      await service.importCsv(mainUser.jwtUser, opImportInput);

      const transactions = await transactionService.search(mainUser.jwtUser, {
        where: { propertyId: opImportInput.propertyId },
      });

      expect(transactions.length).toBe(20);
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

    it('throws NotFoundException when property does not exist', async () => {
      const input: OpImportInput = {
        file: `${MOCKS_PATH}/import/op.transactions.csv`,
        propertyId: 9999,
      };
      await expect(service.importCsv(mainUser.jwtUser, input)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException if user does not have access to property', async () => {
      const input: OpImportInput = {
        file: `${MOCKS_PATH}/import/op.transactions.csv`,
        propertyId: 1, //This property is not the user's property
      };
      await expect(
        service.importCsv(testUsers.userWithoutProperties.jwtUser, input),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
