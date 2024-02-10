/*
Data service test
*/
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { OpImportOptions, OpImportService } from './op.import.service';
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

describe('Op import service', () => {
  let service: OpImportService;
  let expenseService: ExpenseService;
  let expenseTypeService: ExpenseTypeService;
  let incomeService: IncomeService;
  let incomeTypeService: IncomeTypeService;
  let propertyService: PropertyService;
  let app: INestApplication;
  let dataSource: DataSource;
  const opImportOptions: OpImportOptions = {
    csvFile: `${MOCKS_PATH}/import/op.transactions.csv`,
    propertyId: 1,
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

    const expenseType = new ExpenseTypeInputDto();
    expenseType.name = 'Test expense type';
    expenseType.description = '';
    expenseType.isTaxDeductible = true;
    await expenseTypeService.add(expenseType);

    const property = new PropertyInputDto();
    property.name = 'Test property';
    property.size = 29;
    await propertyService.add(property);
  });

  it('import CSV', async () => {
    await service.importCsv(opImportOptions);

    const expenses = await expenseService.findAll();
    const incomes = await incomeService.findAll();

    expect(expenses.length).toBe(7);
    expect(incomes.length).toBe(13);
  });

  it('does not add double', async () => {
    await service.importCsv(opImportOptions);
    await service.importCsv(opImportOptions);

    const expenses = await expenseService.findAll();
    const incomes = await incomeService.findAll();

    expect(expenses.length).toBe(7);
    expect(incomes.length).toBe(13);
  });

  it('parse description correctly', async () => {
    await service.importCsv(opImportOptions);

    const expenses = await expenseService.search({
      relations: { transaction: true },
    });

    const incomes = await incomeService.search({
      relations: { transaction: true },
    });

    expect(expenses[1].transaction.description).toBe('Suihkuverho');
    expect(expenses[2].transaction.description).toBe('Marraskuu sähkölasku');
    expect(expenses[3].transaction.description).toBe('Rahoitusvastike');
    expect(incomes[0].transaction.description).toBe('Airbnb BOFAIE3X');
  });
});
