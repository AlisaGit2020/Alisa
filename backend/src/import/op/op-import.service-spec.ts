/*
Data service test
*/
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { OpImportService } from './op-import.service';
import { MOCKS_PATH } from '@alisa-backend/constants';
import { INestApplication } from '@nestjs/common';
import { IncomeTypeService } from '@alisa-backend/accounting/income/income-type.service';
import { IncomeTypeInputDto } from '@alisa-backend/accounting/income/dtos/income-type-input.dto';
import { ExpenseTypeInputDto } from '@alisa-backend/accounting/expense/dtos/expense-type-input.dto';
import { ExpenseTypeService } from '@alisa-backend/accounting/expense/expense-type.service';
import { PropertyInputDto } from '@alisa-backend/real-estate/property/dtos/property-input.dto';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { ExpenseService } from '@alisa-backend/accounting/expense/expense.service';
import { IncomeService } from '@alisa-backend/accounting/income/income.service';
import { OpImportInput } from './dtos/op-import-input.dto';
import { jwtUser2 } from 'test/data/mocks/user.mock';

describe('Op import service', () => {
  let service: OpImportService;
  let expenseService: ExpenseService;
  let expenseTypeService: ExpenseTypeService;
  let incomeService: IncomeService;
  let incomeTypeService: IncomeTypeService;
  let propertyService: PropertyService;
  let app: INestApplication;
  let dataSource: DataSource;
  const opImportInput: OpImportInput = {
    file: `${MOCKS_PATH}/import/op.transactions.csv`,
    propertyId: 1,
    expenseTypeId: 1,
    incomeTypeId: 1,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    service = app.get<OpImportService>(OpImportService);
    incomeService = app.get<IncomeService>(IncomeService);
    incomeTypeService = app.get<IncomeTypeService>(IncomeTypeService);
    expenseService = app.get<ExpenseService>(ExpenseService);
    expenseTypeService = app.get<ExpenseTypeService>(ExpenseTypeService);
    propertyService = app.get<PropertyService>(PropertyService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    [
      'transaction',
      'expense',
      'expense_type',
      'income',
      'income_type',
      'property',
    ].map(async (tableName) => {
      await dataSource.query(
        `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
      );
    });

    const incomeInputDto = new IncomeTypeInputDto();
    incomeInputDto.name = 'Test income type';
    incomeInputDto.description = '';
    await incomeTypeService.add(incomeInputDto);

    incomeInputDto.name = 'Test income type2';
    incomeInputDto.description = '';
    await incomeTypeService.add(incomeInputDto);

    const expenseType = new ExpenseTypeInputDto();
    expenseType.name = 'Test expense type';
    expenseType.description = '';
    expenseType.isTaxDeductible = true;
    await expenseTypeService.add(expenseType);

    expenseType.name = 'Test expense type2';
    expenseType.description = '';
    expenseType.isTaxDeductible = false;
    await expenseTypeService.add(expenseType);

    const property = new PropertyInputDto();
    property.name = 'Test property';
    property.size = 29;
    await propertyService.add(jwtUser2, property);

    property.name = 'Test property2';
    property.size = 36;
    await propertyService.add(jwtUser2, property);
  });

  it('import CSV', async () => {
    await service.importCsv(opImportInput);

    const expenses = await expenseService.findAll();
    const incomes = await incomeService.findAll();

    expect(expenses.length).toBe(7);
    expect(incomes.length).toBe(13);
  });

  it('does not add double', async () => {
    await service.importCsv(opImportInput);
    await service.importCsv(opImportInput);

    const expenses = await expenseService.findAll();
    const incomes = await incomeService.findAll();

    expect(expenses.length).toBe(7);
    expect(incomes.length).toBe(13);
  });

  it('sets data correctly', async () => {
    await service.importCsv(opImportInput);

    const expenses = await expenseService.search({
      relations: { transaction: true },
    });

    const incomes = await incomeService.search({
      relations: { transaction: true },
    });

    expect(expenses[2].transaction.description).toBe('Marraskuu sähkölasku');
    expect(expenses[3].transaction.description).toBe('Rahoitusvastike');
    expect(incomes[0].transaction.description).toBe('Airbnb BOFAIE3X');

    /*"2023-12-02";"2023-12-02";-17,50;"105";"TILISIIRTO";"KOIVISTO JUHA";"FI4056700820217592";"OKOYFIHH";"ref=";"Viesti: Suihkuverho";"20231202/593619/133287"
     */
    expect(expenses[1].propertyId).toBe(1);
    expect(expenses[1].expenseTypeId).toBe(1);
    expect(expenses[1].transaction.externalId).toBe(
      'df0fe65687b70c62e4d30a6731707f9f394fe01e9d388195829aa716892a1adc',
    );
    expect(expenses[1].transaction.description).toBe('Suihkuverho');
    expect(expenses[1].transaction.amount).toBe(-17.5);
    expect(expenses[1].transaction.transactionDate).toEqual(
      new Date('2023-12-02'),
    );
    expect(expenses[1].transaction.accountingDate).toEqual(
      new Date('2023-12-02'),
    );
  });

  it('changes property, income type and expense type when they change', async () => {
    await service.importCsv(opImportInput);

    let expenses = await expenseService.findAll();
    let incomes = await incomeService.findAll();
    expect(expenses[0].propertyId).toBe(1);
    expect(incomes[0].propertyId).toBe(1);

    const input: OpImportInput = {
      file: `${MOCKS_PATH}/import/op.transactions.csv`,
      propertyId: 2, //Change to another property
      expenseTypeId: 2,
      incomeTypeId: 2,
    };

    await service.importCsv(input);

    expenses = await expenseService.findAll();
    incomes = await incomeService.findAll();

    expect(expenses[0].propertyId).toBe(2);
    expect(incomes[0].propertyId).toBe(2);
    expect(expenses[0].expenseTypeId).toBe(2);
    expect(incomes[0].incomeTypeId).toBe(2);
    expect(expenses.length).toBe(7);
    expect(incomes.length).toBe(13);
  });
});
