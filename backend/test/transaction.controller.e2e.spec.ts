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
import { IncomeTypeService } from '@alisa-backend/accounting/income/income-type.service';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { ExpenseTypeService } from '@alisa-backend/accounting/expense/expense-type.service';
import { DataSource } from 'typeorm';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  addProperty, emptyTables,
  getBearerToken,
  getUserAccessToken2,
} from './helper-functions';
import { jwtUser1, jwtUser2, jwtUser3 } from './data/mocks/user.mock';
import { expenseTypeTestData } from './data/accounting/expense-type.test.data';
import { incomeTypeTestData } from './data/accounting/income-type.test.data';
import { User } from '@alisa-backend/people/user/entities/user.entity';
import { UserService } from '@alisa-backend/people/user/user.service';

describe('Transaction search', () => {
  let app: INestApplication;
  let server: any;
  let token: string;
  let user2: User;
  let user3: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
    server = app.getHttpServer();

    const userService = app.get(UserService);
    const opImportService = app.get(OpImportService);
    const incomeTypeService = app.get(IncomeTypeService);
    const expenseTypeService = app.get(ExpenseTypeService);
    const propertyService = app.get(PropertyService);

    const dataSource = app.get(DataSource);

    await emptyTables(dataSource)

    await userService.add(jwtUser1);
    user2 = await userService.add(jwtUser2);
    user3 = await userService.add(jwtUser3);

    jwtUser2.id = user2.id;
    jwtUser3.id = user3.id;

    const authService = app.get(AuthService);
    token = await getUserAccessToken2(authService, jwtUser2);

    await incomeTypeService.add(incomeTypeTestData.inputPost);
    await expenseTypeService.add(expenseTypeTestData.inputPost);

    await addProperty(propertyService, 'Test property', 29, jwtUser2);

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
      .set('Authorization', getBearerToken(token))
      .expect(200);

    expect(response.body.length).toBe(20);
  });

  it(`filters transaction date correctly`, async () => {
    const response = await request(server)
      .post(`/accounting/transaction/search`)
      .set('Authorization', getBearerToken(token))
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
        .set('Authorization', getBearerToken(token))
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
        .set('Authorization', getBearerToken(token))
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
      .set('Authorization', getBearerToken(token))
      .expect(200);
    expect(response.body.rowCount).toBe(20);
    expect(response.body.totalExpenses).toBe(1689.22);
    expect(response.body.totalIncomes).toBe(1357.67);
    expect(response.body.total).toBe(-331.55);
  });
});
