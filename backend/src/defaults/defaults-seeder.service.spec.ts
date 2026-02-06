import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DefaultsSeeder } from './defaults.seeder';
import { ExpenseTypeDefault } from './entities/expense-type-default.entity';
import { IncomeTypeDefault } from './entities/income-type-default.entity';

describe('DefaultsSeeder', () => {
  let seeder: DefaultsSeeder;
  let mockExpenseTypeDefaultRepo: Record<string, jest.Mock>;
  let mockIncomeTypeDefaultRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockExpenseTypeDefaultRepo = {
      count: jest.fn(),
      save: jest.fn(),
    };

    mockIncomeTypeDefaultRepo = {
      count: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefaultsSeeder,
        {
          provide: getRepositoryToken(ExpenseTypeDefault),
          useValue: mockExpenseTypeDefaultRepo,
        },
        {
          provide: getRepositoryToken(IncomeTypeDefault),
          useValue: mockIncomeTypeDefaultRepo,
        },
      ],
    }).compile();

    seeder = module.get<DefaultsSeeder>(DefaultsSeeder);
  });

  it('seeds 13 expense type defaults when table is empty', async () => {
    mockExpenseTypeDefaultRepo.count.mockResolvedValue(0);
    mockIncomeTypeDefaultRepo.count.mockResolvedValue(0);
    mockExpenseTypeDefaultRepo.save.mockResolvedValue([]);
    mockIncomeTypeDefaultRepo.save.mockResolvedValue([]);

    await seeder.onModuleInit();

    expect(mockExpenseTypeDefaultRepo.save).toHaveBeenCalledTimes(1);
    const savedExpenseTypes = mockExpenseTypeDefaultRepo.save.mock.calls[0][0];
    expect(savedExpenseTypes).toHaveLength(13);
  });

  it('seeds 4 income type defaults when table is empty', async () => {
    mockExpenseTypeDefaultRepo.count.mockResolvedValue(0);
    mockIncomeTypeDefaultRepo.count.mockResolvedValue(0);
    mockExpenseTypeDefaultRepo.save.mockResolvedValue([]);
    mockIncomeTypeDefaultRepo.save.mockResolvedValue([]);

    await seeder.onModuleInit();

    expect(mockIncomeTypeDefaultRepo.save).toHaveBeenCalledTimes(1);
    const savedIncomeTypes = mockIncomeTypeDefaultRepo.save.mock.calls[0][0];
    expect(savedIncomeTypes).toHaveLength(4);
  });

  it('does not seed expense types if data already exists', async () => {
    mockExpenseTypeDefaultRepo.count.mockResolvedValue(13);
    mockIncomeTypeDefaultRepo.count.mockResolvedValue(0);
    mockIncomeTypeDefaultRepo.save.mockResolvedValue([]);

    await seeder.onModuleInit();

    expect(mockExpenseTypeDefaultRepo.save).not.toHaveBeenCalled();
  });

  it('does not seed income types if data already exists', async () => {
    mockExpenseTypeDefaultRepo.count.mockResolvedValue(0);
    mockExpenseTypeDefaultRepo.save.mockResolvedValue([]);
    mockIncomeTypeDefaultRepo.count.mockResolvedValue(4);

    await seeder.onModuleInit();

    expect(mockIncomeTypeDefaultRepo.save).not.toHaveBeenCalled();
  });

  it('seeds expense types with correct loan setting keys', async () => {
    mockExpenseTypeDefaultRepo.count.mockResolvedValue(0);
    mockIncomeTypeDefaultRepo.count.mockResolvedValue(0);
    mockExpenseTypeDefaultRepo.save.mockResolvedValue([]);
    mockIncomeTypeDefaultRepo.save.mockResolvedValue([]);

    await seeder.onModuleInit();

    const savedExpenseTypes = mockExpenseTypeDefaultRepo.save.mock.calls[0][0];
    const withLoanKeys = savedExpenseTypes.filter(
      (t: Partial<ExpenseTypeDefault>) => t.loanSettingKey,
    );
    expect(withLoanKeys).toHaveLength(3);

    const keys = withLoanKeys.map(
      (t: Partial<ExpenseTypeDefault>) => t.loanSettingKey,
    );
    expect(keys).toContain('interest');
    expect(keys).toContain('principal');
    expect(keys).toContain('handlingFee');
  });
});
