import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { ExpenseTypeDefault } from '@alisa-backend/defaults/entities/expense-type-default.entity';
import { IncomeTypeDefault } from '@alisa-backend/defaults/entities/income-type-default.entity';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';
import { User } from '@alisa-backend/people/user/entities/user.entity';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { closeAppGracefully, emptyTables } from './helper-functions';
import * as http from 'http';

describe('User defaults (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let dataSource: DataSource;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    dataSource = app.get(DataSource);
    authService = app.get(AuthService);
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  beforeEach(async () => {
    await emptyTables(dataSource, [
      'expense',
      'expense_type',
      'income',
      'income_type',
      'transaction',
      'ownership',
      'user',
      'property',
      'property_statistics',
    ]);

    // Re-seed defaults since they may have been seeded on app init
    // but we need a clean user state
  });

  describe('Default templates seeding', () => {
    it('seeds default expense types on app startup', async () => {
      const repo = dataSource.getRepository(ExpenseTypeDefault);
      const defaults = await repo.find();

      expect(defaults.length).toBe(13);
    });

    it('seeds default income types on app startup', async () => {
      const repo = dataSource.getRepository(IncomeTypeDefault);
      const defaults = await repo.find();

      expect(defaults.length).toBe(4);
    });
  });

  describe('New user initialization', () => {
    it('creates 13 expense types for a new user after first login', async () => {
      await authService.login({
        firstName: 'New',
        lastName: 'User',
        email: 'new@test.com',
        language: 'fi',
      });

      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { email: 'new@test.com' },
      });

      const expenseTypeRepo = dataSource.getRepository(ExpenseType);
      const expenseTypes = await expenseTypeRepo.find({
        where: { userId: user.id },
      });

      expect(expenseTypes.length).toBe(13);
    });

    it('creates 4 income types for a new user after first login', async () => {
      await authService.login({
        firstName: 'New',
        lastName: 'User',
        email: 'new2@test.com',
        language: 'fi',
      });

      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { email: 'new2@test.com' },
      });

      const incomeTypeRepo = dataSource.getRepository(IncomeType);
      const incomeTypes = await incomeTypeRepo.find({
        where: { userId: user.id },
      });

      expect(incomeTypes.length).toBe(4);
    });

    it('uses Finnish names when user language is fi', async () => {
      await authService.login({
        firstName: 'Finnish',
        lastName: 'User',
        email: 'fi@test.com',
        language: 'fi',
      });

      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { email: 'fi@test.com' },
      });

      const expenseTypeRepo = dataSource.getRepository(ExpenseType);
      const expenseTypes = await expenseTypeRepo.find({
        where: { userId: user.id },
      });

      const names = expenseTypes.map((t) => t.name);
      expect(names).toContain('Yhtiövastike');
      expect(names).toContain('Lainan korko');
    });

    it('uses English names when user language is en', async () => {
      await authService.login({
        firstName: 'English',
        lastName: 'User',
        email: 'en@test.com',
        language: 'en',
      });

      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { email: 'en@test.com' },
      });

      const expenseTypeRepo = dataSource.getRepository(ExpenseType);
      const expenseTypes = await expenseTypeRepo.find({
        where: { userId: user.id },
      });

      const names = expenseTypes.map((t) => t.name);
      expect(names).toContain('Housing company charge');
      expect(names).toContain('Loan interest');
    });

    it('maps loan settings on user entity', async () => {
      await authService.login({
        firstName: 'Loan',
        lastName: 'User',
        email: 'loan@test.com',
        language: 'fi',
      });

      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { email: 'loan@test.com' },
      });

      expect(user.loanInterestExpenseTypeId).toBeDefined();
      expect(user.loanPrincipalExpenseTypeId).toBeDefined();
      expect(user.loanHandlingFeeExpenseTypeId).toBeDefined();

      // Verify they point to actual expense types
      const expenseTypeRepo = dataSource.getRepository(ExpenseType);

      const interestType = await expenseTypeRepo.findOne({
        where: { id: user.loanInterestExpenseTypeId },
      });
      expect(interestType).toBeDefined();
      expect(interestType.name).toBe('Lainan korko');

      const principalType = await expenseTypeRepo.findOne({
        where: { id: user.loanPrincipalExpenseTypeId },
      });
      expect(principalType).toBeDefined();
      expect(principalType.name).toBe('Lainan lyhennys');

      const handlingFeeType = await expenseTypeRepo.findOne({
        where: { id: user.loanHandlingFeeExpenseTypeId },
      });
      expect(handlingFeeType).toBeDefined();
      expect(handlingFeeType.name).toBe('Lainan käsittelykulut');
    });

    it('does not duplicate types on re-login', async () => {
      const userInput = {
        firstName: 'Repeat',
        lastName: 'User',
        email: 'repeat@test.com',
        language: 'fi',
      };

      // First login
      await authService.login(userInput);

      // Second login
      await authService.login(userInput);

      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { email: 'repeat@test.com' },
      });

      const expenseTypeRepo = dataSource.getRepository(ExpenseType);
      const expenseTypes = await expenseTypeRepo.find({
        where: { userId: user.id },
      });

      expect(expenseTypes.length).toBe(13);

      const incomeTypeRepo = dataSource.getRepository(IncomeType);
      const incomeTypes = await incomeTypeRepo.find({
        where: { userId: user.id },
      });

      expect(incomeTypes.length).toBe(4);
    });
  });
});
