/*
End-to-end testing module
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { OpImportService } from '@alisa-backend/import/op/op-import.service';
import { MOCKS_PATH } from '@alisa-backend/constants';
import { OpImportInput } from '@alisa-backend/import/op/dtos/op-import-input.dto';
import { ExpenseTypeInputDto } from '@alisa-backend/accounting/expense/dtos/expense-type-input.dto';
import { IncomeTypeInputDto } from '@alisa-backend/accounting/income/dtos/income-type-input.dto';
import { PropertyInputDto } from '@alisa-backend/real-estate/property/dtos/property-input.dto';
import { IncomeTypeService } from '@alisa-backend/accounting/income/income-type.service';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { ExpenseTypeService } from '@alisa-backend/accounting/expense/expense-type.service';
import { DataSource } from 'typeorm';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { getUserAccessToken } from './helper-functions';
import { jwtUser2 } from './data/mocks/user.mock';

describe('Transaction search', () => {
  let app: INestApplication;
  let server: any;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
    server = app.getHttpServer();

    const dataSource = app.get(DataSource);

    await dataSource.query('TRUNCATE TABLE income RESTART IDENTITY CASCADE;');
    await dataSource.query('TRUNCATE TABLE expense RESTART IDENTITY CASCADE;');
    await dataSource.query(
      'TRUNCATE TABLE income_type RESTART IDENTITY CASCADE;',
    );
    await dataSource.query(
      'TRUNCATE TABLE expense_type RESTART IDENTITY CASCADE;',
    );
    await dataSource.query('TRUNCATE TABLE property RESTART IDENTITY CASCADE;');
    await dataSource.query(
      'TRUNCATE TABLE transaction RESTART IDENTITY CASCADE;',
    );

    const authService = app.get(AuthService);
    token = await getUserAccessToken(authService);

    const opImportService = app.get(OpImportService);
    const incomeTypeService = app.get(IncomeTypeService);
    const expenseTypeService = app.get(ExpenseTypeService);
    const propertyService = app.get(PropertyService);

    const incomeInputDto = new IncomeTypeInputDto();
    incomeInputDto.name = 'Test income type';
    incomeInputDto.description = '';
    await incomeTypeService.add(incomeInputDto);

    const expenseType = new ExpenseTypeInputDto();
    expenseType.name = 'Test expense type';
    expenseType.description = '';
    expenseType.isTaxDeductible = true;
    await expenseTypeService.add(expenseType);

    const property = new PropertyInputDto();
    property.name = 'Test property';
    property.size = 29;
    await propertyService.add(jwtUser2, property);

    const input: OpImportInput = {
      expenseTypeId: 1,
      incomeTypeId: 1,
      propertyId: 1,
      file: `${MOCKS_PATH}/import/op.transactions.csv`,
    };
    await opImportService.importCsv(input);
  });

  afterAll(async () => {
    await app.close();
    server.close();
  });

  it(`fails when not authorized`, async () => {
    await request(server).post(`/accounting/transaction/search`).expect(401);
  });

  it(`returns all transactions`, async () => {
    const response = await request(server)
      .post(`/accounting/transaction/search`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.length).toBe(20);
  });

  it(`filters transaction date correctly`, async () => {
    const response = await request(server)
      .post(`/accounting/transaction/search`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        where: {
          transactionDate: {
            $between: [new Date('2023-12-01'), new Date('2023-12-04')],
          },
        },
      })
      .expect(200);
    expect(response.body.length).toBe(4);
  });

  it.each([
    [1, 20],
    [2, 0],
  ])(
    `filters by property correctly`,
    async (propertyId: number, expectedCount: number) => {
      const response = await request(server)
        .post(`/accounting/transaction/search`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          where: [
            { income: { propertyId: propertyId } },
            { expense: { propertyId: propertyId } },
          ],
        })
        .expect(200);
      expect(response.body.length).toBe(expectedCount);
    },
  );

  it.each([[['expense', 'income'], { expense: true, income: true }]])(
    `fetch statistics correctly with filter`,
    async (relations) => {
      const transactionDateFilter = {
        transactionDate: {
          $between: [new Date('2023-12-01'), new Date('2023-12-22')],
        },
      };

      const response = await request(server)
        .post(`/accounting/transaction/search/statistics`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          relations: relations,
          where: [
            { expense: { propertyId: 1 }, ...transactionDateFilter },
            { income: { propertyId: 1 }, ...transactionDateFilter },
          ],
        })
        .expect(200);

      expect(response.body.rowCount).toBe(16);
      expect(response.body.totalExpenses).toBe(1649.22);
      expect(response.body.totalIncomes).toBe(1078.4);
      expect(response.body.total).toBe(-570.82);
    },
  );

  it(`fetch statistics correctly without filter`, async () => {
    const response = await request(server)
      .post(`/accounting/transaction/search/statistics`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(response.body.rowCount).toBe(20);
    expect(response.body.totalExpenses).toBe(1689.22);
    expect(response.body.totalIncomes).toBe(1357.67);
    expect(response.body.total).toBe(-331.55);
  });
});
