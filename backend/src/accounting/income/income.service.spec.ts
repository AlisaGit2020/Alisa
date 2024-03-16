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
import { IncomeService } from './income.service';
import { incomeTestData } from 'test/data/accounting/income.test.data';
import { startOfDay } from 'date-fns';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionInputDto } from '../transaction/dtos/transaction-input.dto';

import {
  addTransactionsToTestUsers,
  getTestUsers,
  prepareDatabase,
  sleep,
  TestUsersSetup,
} from '../../../test/helper-functions';

describe('Income service', () => {
  let app: INestApplication;
  let service: IncomeService;

  let transactionService: TransactionService;
  let testUsers: TestUsersSetup;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<IncomeService>(IncomeService);
    transactionService = app.get<TransactionService>(TransactionService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    await addTransactionsToTestUsers(app, testUsers);
  });

  afterAll(async () => {
    await app.close();
  });

  const addIncome = async () => {
    return service.add(testUsers.user1WithProperties.jwtUser, {
      quantity: 0,
      totalAmount: 0,
      propertyId: 1,
      incomeTypeId: 1,
      amount: 100,
      description: 'Yhtiövastike',
      transaction: {
        sender: 'John Doe',
        receiver: 'Espoon kaupunki',
        accountingDate: startOfDay(new Date()),
        transactionDate: startOfDay(new Date()),
        amount: 100,
        description: 'Yhtiövastike',
        propertyId: 1,
      } as TransactionInputDto,
    });
  };

  const deleteIncome = async (incomeId: number) => {
    try {
      await service.delete(testUsers.user1WithProperties.jwtUser, incomeId);
    } catch (e) {}
  };

  describe('Create', () => {
    let incomeId: number;
    afterAll(async () => {
      await deleteIncome(incomeId);
    });
    it('adds a new income to user', async () => {
      const savedIncome = await addIncome();
      incomeId = savedIncome.id; //For cleanup
      expect(savedIncome.description).toBe('Yhtiövastike');
      expect(savedIncome.transaction.sender).toBe('John Doe');
    });

    it('throws UnauthorizedException if user does not have access to property', async () => {
      const input = incomeTestData.inputPost;
      await expect(
        service.add(testUsers.user2WithProperties.jwtUser, input),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Read', () => {
    it('finds one income', async () => {
      const income = await service.findOne(
        testUsers.user1WithProperties.jwtUser,
        1,
      );
      expect(income.id).toBe(1);
    });

    it('returns null if income does not exist', async () => {
      const income = await service.findOne(
        testUsers.user1WithProperties.jwtUser,
        999,
      );
      expect(income).toBeNull();
    });

    it('throws UnauthorizedException if user does not have access to property', async () => {
      await expect(
        service.findOne(testUsers.user2WithProperties.jwtUser, 1),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Update', () => {
    let incomeId: number;
    beforeAll(async () => {
      const savedIncome = await addIncome();
      incomeId = savedIncome.id;
    });
    afterAll(async () => {
      await deleteIncome(incomeId);
    });
    it('update income', async () => {
      await service.update(
        testUsers.user1WithProperties.jwtUser,
        incomeId,
        incomeTestData.inputPut,
      );

      const income = await service.findOne(
        testUsers.user1WithProperties.jwtUser,
        incomeId,
        {
          relations: { transaction: true },
        },
      );
      expect(income.description).toBe('Yhtiövastike');
    });

    it('throws NotFoundException if income does not exist', async () => {
      await expect(
        service.update(
          testUsers.user1WithProperties.jwtUser,
          999,
          incomeTestData.inputPut,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException if user does not have access to property', async () => {
      const input = incomeTestData.inputPut;
      await expect(
        service.update(
          testUsers.userWithoutProperties.jwtUser, // This user does not own any properties
          testUsers.user1WithProperties.properties[0].id, // This property is owned by user1
          input,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Delete', () => {
    let transactionId: number;
    let incomeId: number;

    beforeEach(async () => {
      const savedIncome = await addIncome();
      incomeId = savedIncome.id;
      transactionId = savedIncome.transactionId;
    });

    afterEach(async () => {
      try {
        await service.delete(testUsers.user1WithProperties.jwtUser, incomeId);
      } catch (e) {}
    });

    it('it deletes income row, but not transaction row', async () => {
      await service.delete(testUsers.user1WithProperties.jwtUser, incomeId);
      await sleep(20);

      const transaction = await transactionService.findOne(
        testUsers.user1WithProperties.jwtUser,
        transactionId,
      );
      expect(transaction.id).toBeGreaterThanOrEqual(1);

      const savedIncome = await service.findOne(
        testUsers.user1WithProperties.jwtUser,
        incomeId,
      );
      expect(savedIncome).toBeNull();
    });

    it('throws NotFoundException if income does not exist', async () => {
      await expect(
        service.delete(testUsers.user1WithProperties.jwtUser, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it.each([['userWithoutProperties'], ['user2WithProperties']])(
      'throws UnauthorizedException if user does not have access to property',
      async (user: keyof TestUsersSetup) => {
        await expect(
          service.delete(testUsers[user].jwtUser, incomeId),
        ).rejects.toThrow(UnauthorizedException);
      },
    );
  });

  describe('Search', () => {
    it('can search own properties', async () => {
      const incomes = await service.search(
        testUsers.user1WithProperties.jwtUser,
        { where: { property: { id: 1 } } },
      );

      expect(incomes.length).toBe(3);
    });

    it.each([
      ['userWithoutProperties', { property: { id: 3 } }],
      ['user2WithProperties', { property: { id: 1 } }],
      ['userWithoutProperties', undefined],
    ])(
      `Does not return other user's properties`,
      async (user: string, where: object | undefined) => {
        const incomes = await service.search(testUsers[user].jwtUser, {
          where: where,
        });

        expect(incomes.length).toBe(0);
      },
    );
  });
});
