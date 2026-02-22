import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DefaultsSeeder } from './defaults.seeder';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';

describe('DefaultsSeeder', () => {
  let seeder: DefaultsSeeder;
  let mockExpenseTypeRepo: Record<string, jest.Mock>;
  let mockIncomeTypeRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockExpenseTypeRepo = {
      count: jest.fn(),
      save: jest.fn(),
    };

    mockIncomeTypeRepo = {
      count: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefaultsSeeder,
        {
          provide: getRepositoryToken(ExpenseType),
          useValue: mockExpenseTypeRepo,
        },
        {
          provide: getRepositoryToken(IncomeType),
          useValue: mockIncomeTypeRepo,
        },
      ],
    }).compile();

    seeder = module.get<DefaultsSeeder>(DefaultsSeeder);
  });

  it('seeds 15 global expense types when table is empty', async () => {
    mockExpenseTypeRepo.count.mockResolvedValue(0);
    mockIncomeTypeRepo.count.mockResolvedValue(0);
    mockExpenseTypeRepo.save.mockResolvedValue({});
    mockIncomeTypeRepo.save.mockResolvedValue({});

    await seeder.onModuleInit();

    // Each type is saved individually
    expect(mockExpenseTypeRepo.save).toHaveBeenCalledTimes(15);
  });

  it('seeds 4 global income types when table is empty', async () => {
    mockExpenseTypeRepo.count.mockResolvedValue(0);
    mockIncomeTypeRepo.count.mockResolvedValue(0);
    mockExpenseTypeRepo.save.mockResolvedValue({});
    mockIncomeTypeRepo.save.mockResolvedValue({});

    await seeder.onModuleInit();

    // Each type is saved individually
    expect(mockIncomeTypeRepo.save).toHaveBeenCalledTimes(4);
  });

  it('does not seed expense types if data already exists', async () => {
    mockExpenseTypeRepo.count.mockResolvedValue(15);
    mockIncomeTypeRepo.count.mockResolvedValue(0);
    mockIncomeTypeRepo.save.mockResolvedValue({});

    await seeder.onModuleInit();

    expect(mockExpenseTypeRepo.save).not.toHaveBeenCalled();
  });

  it('does not seed income types if data already exists', async () => {
    mockExpenseTypeRepo.count.mockResolvedValue(0);
    mockExpenseTypeRepo.save.mockResolvedValue({});
    mockIncomeTypeRepo.count.mockResolvedValue(4);

    await seeder.onModuleInit();

    expect(mockIncomeTypeRepo.save).not.toHaveBeenCalled();
  });

  it('seeds expense types with loan-related keys', async () => {
    mockExpenseTypeRepo.count.mockResolvedValue(0);
    mockIncomeTypeRepo.count.mockResolvedValue(0);
    mockExpenseTypeRepo.save.mockResolvedValue({});
    mockIncomeTypeRepo.save.mockResolvedValue({});

    await seeder.onModuleInit();

    const savedKeys = mockExpenseTypeRepo.save.mock.calls.map(
      (call) => call[0].key,
    );
    expect(savedKeys).toContain('loan-interest');
    expect(savedKeys).toContain('loan-principal');
    expect(savedKeys).toContain('loan-handling-fee');
  });

  it('seeds expense types with unique keys', async () => {
    mockExpenseTypeRepo.count.mockResolvedValue(0);
    mockIncomeTypeRepo.count.mockResolvedValue(0);
    mockExpenseTypeRepo.save.mockResolvedValue({});
    mockIncomeTypeRepo.save.mockResolvedValue({});

    await seeder.onModuleInit();

    const savedKeys = mockExpenseTypeRepo.save.mock.calls.map(
      (call) => call[0].key,
    );
    const uniqueKeys = new Set(savedKeys);
    expect(uniqueKeys.size).toBe(15);
  });

  it('seeds income types with unique keys', async () => {
    mockExpenseTypeRepo.count.mockResolvedValue(0);
    mockIncomeTypeRepo.count.mockResolvedValue(0);
    mockExpenseTypeRepo.save.mockResolvedValue({});
    mockIncomeTypeRepo.save.mockResolvedValue({});

    await seeder.onModuleInit();

    const savedKeys = mockIncomeTypeRepo.save.mock.calls.map(
      (call) => call[0].key,
    );
    const uniqueKeys = new Set(savedKeys);
    expect(uniqueKeys.size).toBe(4);
    expect(savedKeys).toContain('airbnb');
    expect(savedKeys).toContain('rental');
  });
});
