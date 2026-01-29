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
  addIncomeTypes,
  emptyTables,
  getTestUsers,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from '../../../test/helper-functions';
import { IncomeTypeService } from '@alisa-backend/accounting/income/income-type.service';
import { DataSource } from 'typeorm';

describe('Income type service', () => {
  let app: INestApplication;
  let service: IncomeTypeService;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<IncomeTypeService>(IncomeTypeService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;
    //await addIncomeTypes(mainUser.jwtUser, app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Create', () => {
    afterAll(async () => {
      await emptyTables(app.get(DataSource), ['income_type']);
    });
    it('creates a new income type to a user', async () => {
      const input = {
        name: 'Test income type',
        description: 'Test description',
        isTaxDeductible: false,
      };
      const newIncomeType = await service.add(mainUser.jwtUser, input);

      expect(newIncomeType).toMatchObject(input);
    });
    it('throws when saving with the existing name', async () => {
      const input = {
        name: 'Test income type',
        description: 'Test description',
        isTaxDeductible: false,
      };
      await expect(service.add(mainUser.jwtUser, input)).rejects.toThrow();
    });
    it('does not throw when saving with the existing name to another user', async () => {
      const input = {
        name: 'Test income type',
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
      await emptyTables(app.get(DataSource), ['income_type']);
    });

    it(`reads user's income type `, async () => {
      await addIncomeTypes(mainUser.jwtUser, app);
      const incomeTypes = await service.findOne(mainUser.jwtUser, 1);
      expect(incomeTypes).toBeDefined();
    });

    it('returns null, when income type does not exist', async () => {
      const incomeType = await service.findOne(mainUser.jwtUser, 999);
      expect(incomeType).toBeNull();
    });

    it(`throws when reading another user's income type`, async () => {
      await expect(
        service.findOne(testUsers.userWithoutProperties.jwtUser, 1),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Update', () => {
    let incomeTypeId: number;
    beforeAll(async () => {
      await addIncomeTypes(mainUser.jwtUser, app);
      incomeTypeId = 1;
    });

    afterAll(async () => {
      await emptyTables(app.get(DataSource), ['income_type']);
    });

    it('updates income type', async () => {
      const input = {
        name: 'Updated income type',
        description: 'Updated description',
      };
      await service.update(mainUser.jwtUser, incomeTypeId, input);

      const incomeType = await service.findOne(mainUser.jwtUser, incomeTypeId);
      expect(incomeType).toMatchObject(input);
    });

    it('throws not found when updating non-existing income type', async () => {
      const input = {
        name: 'Updated income type',
        description: 'Updated description',
        isTaxDeductible: true,
      };
      await expect(
        service.update(mainUser.jwtUser, 999, input),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when updating another user income type', async () => {
      const input = {
        name: 'Updated income type',
        description: 'Updated description',
        isTaxDeductible: true,
      };
      await expect(
        service.update(
          testUsers.userWithoutProperties.jwtUser,
          incomeTypeId,
          input,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Delete', () => {
    let incomeTypeId: number;
    beforeAll(async () => {
      await addIncomeTypes(mainUser.jwtUser, app);
      incomeTypeId = 1;
    });

    afterAll(async () => {
      await emptyTables(app.get(DataSource), ['income_type']);
    });

    it('throws not found when deleting non-existing income type', async () => {
      await expect(service.delete(mainUser.jwtUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when deleting another user income type', async () => {
      await expect(
        service.delete(testUsers.userWithoutProperties.jwtUser, incomeTypeId),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deletes user income type', async () => {
      await service.delete(mainUser.jwtUser, incomeTypeId);

      const incomeType = await service.findOne(mainUser.jwtUser, incomeTypeId);
      expect(incomeType).toBeNull();
    });
  });

  describe('Search', () => {
    beforeAll(async () => {
      await addIncomeTypes(mainUser.jwtUser, app);
    });
    afterAll(async () => {
      await emptyTables(app.get(DataSource), ['income_type']);
    });

    it(`searches user's income types`, async () => {
      const incomeTypes = await service.search(mainUser.jwtUser, {
        where: { name: 'Airbnb' },
      });
      expect(incomeTypes.length).toBe(1);
    });

    it('returns empty result when user has no income types', async () => {
      const incomeTypes = await service.search(
        testUsers.userWithoutProperties.jwtUser,
        {},
      );
      expect(incomeTypes.length).toBe(0);
    });
  });
});
