import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DepreciationService } from './depreciation.service';
import { DepreciationAsset } from './entities/depreciation-asset.entity';
import { DepreciationRecord } from './entities/depreciation-record.entity';
import { AuthService } from '@asset-backend/auth/auth.service';
import { JWTUser } from '@asset-backend/auth/types';
import { Expense } from '@asset-backend/accounting/expense/entities/expense.entity';

describe('DepreciationService', () => {
  let service: DepreciationService;
  let assetRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let recordRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let mockDataSource: {
    query: jest.Mock;
  };

  const createMockAsset = (overrides: Partial<DepreciationAsset> = {}): DepreciationAsset => ({
    id: 1,
    expenseId: 1,
    propertyId: 1,
    originalAmount: 10000,
    acquisitionYear: 2020,
    acquisitionMonth: 6,
    remainingAmount: 10000,
    isFullyDepreciated: false,
    description: 'Test improvement',
    expense: null,
    property: null,
    depreciationRecords: [],
    ...overrides,
  });

  beforeEach(async () => {
    assetRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    recordRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    mockDataSource = {
      query: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepreciationService,
        {
          provide: getRepositoryToken(DepreciationAsset),
          useValue: assetRepository,
        },
        {
          provide: getRepositoryToken(DepreciationRecord),
          useValue: recordRepository,
        },
        {
          provide: AuthService,
          useValue: {
            addOwnershipFilter: jest.fn(),
            hasOwnership: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DepreciationService>(DepreciationService);
  });

  describe('calculateAnnualDepreciation', () => {
    it('should calculate 10% of original amount', () => {
      const asset = createMockAsset({ originalAmount: 10000, remainingAmount: 10000 });
      const result = service.calculateAnnualDepreciation(asset, 2020);
      expect(result).toBe(1000);
    });

    it('should calculate correct depreciation for different amounts', () => {
      const asset = createMockAsset({ originalAmount: 5000, remainingAmount: 5000 });
      expect(service.calculateAnnualDepreciation(asset, 2020)).toBe(500);

      const asset2 = createMockAsset({ originalAmount: 15000, remainingAmount: 15000 });
      expect(service.calculateAnnualDepreciation(asset2, 2020)).toBe(1500);
    });

    it('should return 0 for fully depreciated asset', () => {
      const asset = createMockAsset({
        remainingAmount: 0,
        isFullyDepreciated: true,
      });
      const result = service.calculateAnnualDepreciation(asset, 2024);
      expect(result).toBe(0);
    });

    it('should return 0 after 10 years', () => {
      const asset = createMockAsset({ acquisitionYear: 2015 });
      // Year 2025 is 10 years after 2015, should return 0
      const result = service.calculateAnnualDepreciation(asset, 2025);
      expect(result).toBe(0);
    });

    it('should return 0 before acquisition year', () => {
      const asset = createMockAsset({ acquisitionYear: 2024 });
      const result = service.calculateAnnualDepreciation(asset, 2023);
      expect(result).toBe(0);
    });

    it('should not exceed remaining amount', () => {
      const asset = createMockAsset({
        originalAmount: 10000,
        remainingAmount: 500,
      });
      // 10% of 10000 is 1000, but only 500 remains
      const result = service.calculateAnnualDepreciation(asset, 2020);
      expect(result).toBe(500);
    });

    it('should depreciate full year regardless of acquisition month', () => {
      // Even if acquired in December, get full 10% for that year
      const asset = createMockAsset({
        acquisitionYear: 2020,
        acquisitionMonth: 12,
        originalAmount: 10000,
        remainingAmount: 10000,
      });
      const result = service.calculateAnnualDepreciation(asset, 2020);
      expect(result).toBe(1000);
    });
  });

  describe('10-year depreciation limit', () => {
    it('should depreciate for exactly 10 years', () => {
      const asset = createMockAsset({
        acquisitionYear: 2020,
        originalAmount: 10000,
        remainingAmount: 10000,
      });

      // Years 2020-2029: 1000 € / year (10 years)
      for (let year = 2020; year <= 2029; year++) {
        expect(service.calculateAnnualDepreciation(asset, year)).toBe(1000);
      }

      // Year 2030: 0 € (11th year)
      expect(service.calculateAnnualDepreciation(asset, 2030)).toBe(0);
    });

    it('should calculate total 100% depreciation over 10 years', () => {
      const asset = createMockAsset({
        acquisitionYear: 2020,
        originalAmount: 10000,
        remainingAmount: 10000,
      });

      let totalDepreciated = 0;
      for (let year = 2020; year <= 2029; year++) {
        totalDepreciated += service.calculateAnnualDepreciation(asset, year);
      }

      expect(totalDepreciated).toBe(10000); // 100%
    });

    it('should return 0 for year 11 and beyond', () => {
      const asset = createMockAsset({
        acquisitionYear: 2010,
        originalAmount: 10000,
        remainingAmount: 10000,
      });

      // Years 11, 12, 13 should all return 0
      expect(service.calculateAnnualDepreciation(asset, 2020)).toBe(0);
      expect(service.calculateAnnualDepreciation(asset, 2021)).toBe(0);
      expect(service.calculateAnnualDepreciation(asset, 2022)).toBe(0);
    });
  });

  describe('getYearlyBreakdown', () => {
    it('should return all assets for property', async () => {
      const assets = [
        createMockAsset({ id: 1, description: 'Bathroom renovation', originalAmount: 10000 }),
        createMockAsset({ id: 2, description: 'Kitchen renovation', originalAmount: 5000 }),
      ];
      assetRepository.find.mockResolvedValue(assets);

      const result = await service.getYearlyBreakdown(
        { id: 1 } as JWTUser,
        [1],
        2020,
      );

      expect(result.items).toHaveLength(2);
      expect(result.items[0].description).toBe('Bathroom renovation');
      expect(result.items[1].description).toBe('Kitchen renovation');
    });

    it('should calculate depreciation for each asset', async () => {
      const assets = [
        createMockAsset({ id: 1, originalAmount: 10000, acquisitionYear: 2020 }),
        createMockAsset({ id: 2, originalAmount: 5000, acquisitionYear: 2020 }),
      ];
      assetRepository.find.mockResolvedValue(assets);

      const result = await service.getYearlyBreakdown(
        { id: 1 } as JWTUser,
        [1],
        2020,
      );

      expect(result.items[0].depreciationAmount).toBe(1000);
      expect(result.items[1].depreciationAmount).toBe(500);
      expect(result.totalDepreciation).toBe(1500);
    });

    it('should calculate correct years remaining', async () => {
      const assets = [
        createMockAsset({ id: 1, acquisitionYear: 2020 }),
      ];
      assetRepository.find.mockResolvedValue(assets);

      // In 2024, asset from 2020 has 4 years elapsed (2020-2023), 5 years remaining
      const result = await service.getYearlyBreakdown(
        { id: 1 } as JWTUser,
        [1],
        2024,
      );

      expect(result.items[0].yearsRemaining).toBe(5);
    });

    it('should exclude fully depreciated assets outside 10-year window', async () => {
      const assets = [
        createMockAsset({
          id: 1,
          acquisitionYear: 2010,
          originalAmount: 10000,
          remainingAmount: 0,
          isFullyDepreciated: true,
        }),
      ];
      assetRepository.find.mockResolvedValue(assets);

      const result = await service.getYearlyBreakdown(
        { id: 1 } as JWTUser,
        [1],
        2024,
      );

      // Asset is past 10-year window so should not be included
      expect(result.items).toHaveLength(0);
      expect(result.totalDepreciation).toBe(0);
    });

    it('should include assets within 10-year window even with 0 depreciation for current year', async () => {
      const assets = [
        createMockAsset({
          id: 1,
          acquisitionYear: 2020,
          remainingAmount: 0,
          isFullyDepreciated: true,
        }),
      ];
      assetRepository.find.mockResolvedValue(assets);

      // In 2024, asset is still within 10-year window (2020-2029)
      const result = await service.getYearlyBreakdown(
        { id: 1 } as JWTUser,
        [1],
        2024,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].depreciationAmount).toBe(0);
      expect(result.items[0].isFullyDepreciated).toBe(true);
    });
  });

  describe('createFromExpense', () => {
    it('should create asset from capital improvement expense', async () => {
      const expense = {
        id: 1,
        propertyId: 1,
        totalAmount: -10000, // Expenses are stored as negative
        accountingDate: new Date('2024-06-15'),
        description: 'Bathroom renovation',
      } as Partial<Expense> as Expense;

      assetRepository.findOne.mockResolvedValue(null);
      assetRepository.save.mockResolvedValue({
        ...expense,
        id: 1,
        originalAmount: 10000,
        acquisitionYear: 2024,
        acquisitionMonth: 6,
        remainingAmount: 10000,
        isFullyDepreciated: false,
      });

      const result = await service.createFromExpense(expense);

      expect(result.originalAmount).toBe(10000); // Should be positive
      expect(result.acquisitionYear).toBe(2024);
      expect(result.acquisitionMonth).toBe(6);
      expect(result.remainingAmount).toBe(10000);
      expect(result.isFullyDepreciated).toBe(false);
    });

    it('should set correct acquisition year from accountingDate', async () => {
      const expense = {
        id: 1,
        propertyId: 1,
        totalAmount: -5000,
        accountingDate: new Date('2022-01-01'),
        description: 'Kitchen renovation',
      } as Partial<Expense> as Expense;

      assetRepository.findOne.mockResolvedValue(null);
      assetRepository.save.mockResolvedValue({
        id: 1,
        acquisitionYear: 2022,
        acquisitionMonth: 1,
        originalAmount: 5000,
        remainingAmount: 5000,
        isFullyDepreciated: false,
      });

      const result = await service.createFromExpense(expense);

      expect(result.acquisitionYear).toBe(2022);
      expect(result.acquisitionMonth).toBe(1);
    });

    it('should not create duplicate asset if one exists', async () => {
      const existingAsset = createMockAsset();
      assetRepository.findOne.mockResolvedValue(existingAsset);

      const expense = {
        id: 1,
        propertyId: 1,
        totalAmount: -10000,
        accountingDate: new Date('2024-06-15'),
        description: 'Bathroom renovation',
      } as Partial<Expense> as Expense;

      const result = await service.createFromExpense(expense);

      expect(result).toBe(existingAsset);
      expect(assetRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('processYearlyDepreciation', () => {
    it('should create depreciation record for asset', async () => {
      const asset = createMockAsset({
        id: 1,
        originalAmount: 10000,
        remainingAmount: 10000,
        acquisitionYear: 2020,
      });
      assetRepository.find.mockResolvedValue([asset]);
      recordRepository.findOne.mockResolvedValue(null);
      recordRepository.save.mockResolvedValue({ id: 1 });
      assetRepository.save.mockResolvedValue(asset);

      await service.processYearlyDepreciation({ id: 1 } as JWTUser, [1], 2020);

      expect(recordRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          depreciationAssetId: 1,
          year: 2020,
          amount: 1000,
          remainingAfter: 9000,
        }),
      );
    });

    it('should update asset remaining amount after depreciation', async () => {
      const asset = createMockAsset({
        id: 1,
        originalAmount: 10000,
        remainingAmount: 10000,
        acquisitionYear: 2020,
      });
      assetRepository.find.mockResolvedValue([asset]);
      recordRepository.findOne.mockResolvedValue(null);
      recordRepository.save.mockResolvedValue({ id: 1 });
      assetRepository.save.mockResolvedValue(asset);

      await service.processYearlyDepreciation({ id: 1 } as JWTUser, [1], 2020);

      expect(assetRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          remainingAmount: 9000,
        }),
      );
    });

    it('should mark asset as fully depreciated when remaining becomes 0', async () => {
      const asset = createMockAsset({
        id: 1,
        originalAmount: 10000,
        remainingAmount: 1000, // Only 1000 left, will be 0 after depreciation
        acquisitionYear: 2020,
      });
      assetRepository.find.mockResolvedValue([asset]);
      recordRepository.findOne.mockResolvedValue(null);
      recordRepository.save.mockResolvedValue({ id: 1 });
      assetRepository.save.mockResolvedValue(asset);

      await service.processYearlyDepreciation({ id: 1 } as JWTUser, [1], 2020);

      expect(assetRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          remainingAmount: 0,
          isFullyDepreciated: true,
        }),
      );
    });

    it('should skip if already processed for year', async () => {
      const asset = createMockAsset();
      const existingRecord = { id: 1, depreciationAssetId: 1, year: 2020 } as Partial<DepreciationRecord>;
      assetRepository.find.mockResolvedValue([asset]);
      recordRepository.findOne.mockResolvedValue(existingRecord);

      await service.processYearlyDepreciation({ id: 1 } as JWTUser, [1], 2020);

      expect(recordRepository.save).not.toHaveBeenCalled();
      expect(assetRepository.save).not.toHaveBeenCalled();
    });
  });
});
