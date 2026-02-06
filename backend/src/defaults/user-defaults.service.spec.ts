import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserDefaultsService } from './user-defaults.service';
import { ExpenseTypeDefault } from './entities/expense-type-default.entity';
import { IncomeTypeDefault } from './entities/income-type-default.entity';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';
import { UserService } from '@alisa-backend/people/user/user.service';
import { createUser } from 'test/factories';

const expenseTypeDefaults: Partial<ExpenseTypeDefault>[] = [
  {
    id: 1,
    nameFi: 'Yhtiövastike',
    nameEn: 'Housing company charge',
    isTaxDeductible: true,
    isCapitalImprovement: false,
    loanSettingKey: null,
  },
  {
    id: 2,
    nameFi: 'Perusparannus',
    nameEn: 'Capital improvement',
    isTaxDeductible: false,
    isCapitalImprovement: true,
    loanSettingKey: null,
  },
  {
    id: 3,
    nameFi: 'Lainan korko',
    nameEn: 'Loan interest',
    isTaxDeductible: true,
    isCapitalImprovement: false,
    loanSettingKey: 'interest',
  },
  {
    id: 4,
    nameFi: 'Lainan lyhennys',
    nameEn: 'Loan principal',
    isTaxDeductible: false,
    isCapitalImprovement: false,
    loanSettingKey: 'principal',
  },
  {
    id: 5,
    nameFi: 'Lainan käsittelykulut',
    nameEn: 'Loan handling fees',
    isTaxDeductible: true,
    isCapitalImprovement: false,
    loanSettingKey: 'handlingFee',
  },
];

const incomeTypeDefaults: Partial<IncomeTypeDefault>[] = [
  { id: 1, nameFi: 'Vuokratulo', nameEn: 'Rental income', isTaxable: true },
  { id: 2, nameFi: 'Airbnb', nameEn: 'Airbnb', isTaxable: true },
  { id: 3, nameFi: 'Pääomatulo', nameEn: 'Capital income', isTaxable: true },
  {
    id: 4,
    nameFi: 'Vakuutuskorvaus',
    nameEn: 'Insurance compensation',
    isTaxable: true,
  },
];

describe('UserDefaultsService', () => {
  let service: UserDefaultsService;
  let mockExpenseTypeDefaultRepo: Record<string, jest.Mock>;
  let mockIncomeTypeDefaultRepo: Record<string, jest.Mock>;
  let mockExpenseTypeRepo: Record<string, jest.Mock>;
  let mockIncomeTypeRepo: Record<string, jest.Mock>;
  let mockUserService: Partial<Record<keyof UserService, jest.Mock>>;

  let savedExpenseTypeId: number;

  beforeEach(async () => {
    savedExpenseTypeId = 0;

    mockExpenseTypeDefaultRepo = {
      find: jest.fn().mockResolvedValue(expenseTypeDefaults),
    };

    mockIncomeTypeDefaultRepo = {
      find: jest.fn().mockResolvedValue(incomeTypeDefaults),
    };

    mockExpenseTypeRepo = {
      count: jest.fn().mockResolvedValue(0),
      save: jest.fn().mockImplementation((entity: ExpenseType) => {
        savedExpenseTypeId++;
        return Promise.resolve({ ...entity, id: savedExpenseTypeId });
      }),
    };

    mockIncomeTypeRepo = {
      save: jest.fn().mockImplementation((entity: IncomeType) => {
        return Promise.resolve({ ...entity, id: 1 });
      }),
    };

    mockUserService = {
      findOne: jest.fn().mockResolvedValue(createUser({ id: 1 })),
      update: jest.fn().mockResolvedValue(createUser({ id: 1 })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserDefaultsService,
        {
          provide: getRepositoryToken(ExpenseTypeDefault),
          useValue: mockExpenseTypeDefaultRepo,
        },
        {
          provide: getRepositoryToken(IncomeTypeDefault),
          useValue: mockIncomeTypeDefaultRepo,
        },
        {
          provide: getRepositoryToken(ExpenseType),
          useValue: mockExpenseTypeRepo,
        },
        {
          provide: getRepositoryToken(IncomeType),
          useValue: mockIncomeTypeRepo,
        },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<UserDefaultsService>(UserDefaultsService);
  });

  it('creates expense types from templates with Finnish names', async () => {
    await service.initializeDefaults(1, 'fi');

    expect(mockExpenseTypeRepo.save).toHaveBeenCalledTimes(
      expenseTypeDefaults.length,
    );

    const firstCall = mockExpenseTypeRepo.save.mock.calls[0][0];
    expect(firstCall.name).toBe('Yhtiövastike');
    expect(firstCall.userId).toBe(1);
  });

  it('creates expense types with English names when language is en', async () => {
    await service.initializeDefaults(1, 'en');

    const firstCall = mockExpenseTypeRepo.save.mock.calls[0][0];
    expect(firstCall.name).toBe('Housing company charge');
  });

  it('creates income types from templates', async () => {
    await service.initializeDefaults(1, 'fi');

    expect(mockIncomeTypeRepo.save).toHaveBeenCalledTimes(
      incomeTypeDefaults.length,
    );

    const firstCall = mockIncomeTypeRepo.save.mock.calls[0][0];
    expect(firstCall.name).toBe('Vuokratulo');
    expect(firstCall.userId).toBe(1);
  });

  it('normalizes fi-FI to fi', async () => {
    await service.initializeDefaults(1, 'fi-FI');

    const firstCall = mockExpenseTypeRepo.save.mock.calls[0][0];
    expect(firstCall.name).toBe('Yhtiövastike');
  });

  it('normalizes en-US to en', async () => {
    await service.initializeDefaults(1, 'en-US');

    const firstCall = mockExpenseTypeRepo.save.mock.calls[0][0];
    expect(firstCall.name).toBe('Housing company charge');
  });

  it('normalizes fi_FI (underscore) to fi', async () => {
    await service.initializeDefaults(1, 'fi_FI');

    const firstCall = mockExpenseTypeRepo.save.mock.calls[0][0];
    expect(firstCall.name).toBe('Yhtiövastike');
  });

  it('normalizes en_US (underscore) to en', async () => {
    await service.initializeDefaults(1, 'en_US');

    const firstCall = mockExpenseTypeRepo.save.mock.calls[0][0];
    expect(firstCall.name).toBe('Housing company charge');
  });

  it('defaults to fi when language is undefined', async () => {
    await service.initializeDefaults(1, undefined);

    const firstCall = mockExpenseTypeRepo.save.mock.calls[0][0];
    expect(firstCall.name).toBe('Yhtiövastike');
  });

  it('defaults to fi when language is null', async () => {
    await service.initializeDefaults(1, null);

    const firstCall = mockExpenseTypeRepo.save.mock.calls[0][0];
    expect(firstCall.name).toBe('Yhtiövastike');
  });

  it('copies isTaxDeductible from templates', async () => {
    await service.initializeDefaults(1, 'fi');

    const calls = mockExpenseTypeRepo.save.mock.calls;
    expect(calls[0][0].isTaxDeductible).toBe(true);
    expect(calls[1][0].isTaxDeductible).toBe(false);
  });

  it('copies isCapitalImprovement from templates', async () => {
    await service.initializeDefaults(1, 'fi');

    const calls = mockExpenseTypeRepo.save.mock.calls;
    expect(calls[0][0].isCapitalImprovement).toBe(false);
    expect(calls[1][0].isCapitalImprovement).toBe(true);
  });

  it('copies isTaxable from income type templates', async () => {
    await service.initializeDefaults(1, 'fi');

    const firstCall = mockIncomeTypeRepo.save.mock.calls[0][0];
    expect(firstCall.isTaxable).toBe(true);
  });

  it('maps loan expense type IDs to user settings', async () => {
    await service.initializeDefaults(1, 'fi');

    expect(mockUserService.update).toHaveBeenCalledTimes(1);

    const updateCall = mockUserService.update.mock.calls[0];
    expect(updateCall[0]).toBe(1);

    const updatedUser = updateCall[1];
    expect(updatedUser.loanInterestExpenseTypeId).toBeDefined();
    expect(updatedUser.loanPrincipalExpenseTypeId).toBeDefined();
    expect(updatedUser.loanHandlingFeeExpenseTypeId).toBeDefined();
  });

  it('skips initialization if user already has expense types', async () => {
    mockExpenseTypeRepo.count.mockResolvedValue(5);

    await service.initializeDefaults(1, 'fi');

    expect(mockExpenseTypeRepo.save).not.toHaveBeenCalled();
    expect(mockIncomeTypeRepo.save).not.toHaveBeenCalled();
    expect(mockUserService.update).not.toHaveBeenCalled();
  });

  it('does not throw if save fails', async () => {
    mockExpenseTypeRepo.count.mockRejectedValue(new Error('DB error'));

    await expect(
      service.initializeDefaults(1, 'fi'),
    ).resolves.not.toThrow();
  });
});
