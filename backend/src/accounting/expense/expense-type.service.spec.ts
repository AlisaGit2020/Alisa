/*
Data service test
*/
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppModule } from 'src/app.module';

import {
  addExpenseTypes,
  emptyTables,
  getTestUsers,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from '../../../test/helper-functions';
import { ExpenseTypeService } from '@alisa-backend/accounting/expense/expense-type.service';
import { DataSource } from 'typeorm';

describe('Expense type service', () => {
  let app: INestApplication;
  let service: ExpenseTypeService;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<ExpenseTypeService>(ExpenseTypeService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;
    //await addExpenseTypes(mainUser.jwtUser, app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Create', () => {
    afterAll(async () => {
      await emptyTables(app.get(DataSource), ['expense_type']);
    });
    it('creates a new expense type to a user', async () => {
      const input = {
        name: 'Test expense type',
        description: 'Test description',
        isTaxDeductible: false,
      };
      const newExpenseType = await service.add(mainUser.jwtUser, input);

      expect(newExpenseType).toMatchObject(input);
    });
    it('throws when saving with the existing name', async () => {
      const input = {
        name: 'Test expense type',
        description: 'Test description',
        isTaxDeductible: false,
      };
      await expect(service.add(mainUser.jwtUser, input)).rejects.toThrowError();
    });
    it('does not throw when saving with the existing name to another user', async () => {
      const input = {
        name: 'Test expense type',
        description: 'Test description',
        isTaxDeductible: false,
      };
      await expect(
        service.add(testUsers.userWithoutProperties.jwtUser, input),
      ).resolves.toBeDefined();
    });
  });

  describe('Read', () => {
    afterAll(async () => {
      await emptyTables(app.get(DataSource), ['expense_type']);
    });

    it(`reads user's expense type `, async () => {
      await addExpenseTypes(mainUser.jwtUser, app);
      const expenseTypes = await service.findOne(mainUser.jwtUser, 1);
      expect(expenseTypes).toBeDefined();
    });

    it('returns null, when expense type does not exist', async () => {
      const expenseType = await service.findOne(mainUser.jwtUser, 999);
      expect(expenseType).toBeNull();
    });

    it(`throws when reading another user's expense type`, async () => {
      await expect(
        service.findOne(testUsers.userWithoutProperties.jwtUser, 1),
      ).rejects.toThrowError(UnauthorizedException);
    });
  });

  describe('Update', () => {
    let expenseTypeId: number;
    beforeAll(async () => {
      await addExpenseTypes(mainUser.jwtUser, app);
      expenseTypeId = 1;
    });

    afterAll(async () => {
      await emptyTables(app.get(DataSource), ['expense_type']);
    });

    it('updates expense type', async () => {
      const input = {
        name: 'Updated expense type',
        description: 'Updated description',
        isTaxDeductible: true,
      };
      await service.update(mainUser.jwtUser, expenseTypeId, input);

      const expenseType = await service.findOne(
        mainUser.jwtUser,
        expenseTypeId,
      );
      expect(expenseType).toMatchObject(input);
    });

    it('throws not found when updating non-existing expense type', async () => {
      const input = {
        name: 'Updated expense type',
        description: 'Updated description',
        isTaxDeductible: true,
      };
      await expect(
        service.update(mainUser.jwtUser, 999, input),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throws when updating another user expense type', async () => {
      const input = {
        name: 'Updated expense type',
        description: 'Updated description',
        isTaxDeductible: true,
      };
      await expect(
        service.update(
          testUsers.userWithoutProperties.jwtUser,
          expenseTypeId,
          input,
        ),
      ).rejects.toThrowError(UnauthorizedException);
    });
  });

  describe('Delete', () => {
    let expenseTypeId: number;
    beforeAll(async () => {
      await addExpenseTypes(mainUser.jwtUser, app);
      expenseTypeId = 1;
    });

    afterAll(async () => {
      await emptyTables(app.get(DataSource), ['expense_type']);
    });

    it('throws not found when deleting non-existing expense type', async () => {
      await expect(service.delete(mainUser.jwtUser, 999)).rejects.toThrowError(
        NotFoundException,
      );
    });

    it('throws when deleting another user expense type', async () => {
      await expect(
        service.delete(testUsers.userWithoutProperties.jwtUser, expenseTypeId),
      ).rejects.toThrowError(UnauthorizedException);
    });

    it('deletes user expense type', async () => {
      await service.delete(mainUser.jwtUser, expenseTypeId);

      const expenseType = await service.findOne(
        mainUser.jwtUser,
        expenseTypeId,
      );
      expect(expenseType).toBeNull();
    });
  });

  describe('Search', () => {
    beforeAll(async () => {
      await addExpenseTypes(mainUser.jwtUser, app);
    });
    afterAll(async () => {
      await emptyTables(app.get(DataSource), ['expense_type']);
    });

    it(`searches user's expense types`, async () => {
      const expenseTypes = await service.search(mainUser.jwtUser, {
        where: { name: 'Siivous' },
      });
      expect(expenseTypes.length).toBe(1);
    });

    it('returns empty result when user has no expense types', async () => {
      const expenseTypes = await service.search(
        testUsers.userWithoutProperties.jwtUser,
        {},
      );
      expect(expenseTypes.length).toBe(0);
    });
  });
});
