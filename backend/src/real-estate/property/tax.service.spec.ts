import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TaxService } from './tax.service';
import { PropertyStatistics } from './entities/property-statistics.entity';
import { PropertyService } from './property.service';
import { DepreciationService } from '@alisa-backend/accounting/depreciation/depreciation.service';
import { createMockRepository, MockRepository } from 'test/mocks';
import { createJWTUser } from 'test/factories';
import { StatisticKey } from '@alisa-backend/common/types';

describe('TaxService', () => {
  let service: TaxService;
  let mockStatsRepository: MockRepository<PropertyStatistics>;
  let mockPropertyService: Partial<PropertyService>;
  let mockDataSource: Partial<DataSource>;
  let mockDepreciationService: Partial<DepreciationService>;

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
  const userWithNoProperties = createJWTUser({ id: 2, ownershipInProperties: [] });

  beforeEach(async () => {
    mockStatsRepository = createMockRepository<PropertyStatistics>();

    mockPropertyService = {
      findOne: jest.fn(),
      search: jest.fn(),
    };

    mockDataSource = {
      query: jest.fn(),
    };

    mockDepreciationService = {
      getYearlyBreakdown: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxService,
        { provide: getRepositoryToken(PropertyStatistics), useValue: mockStatsRepository },
        { provide: PropertyService, useValue: mockPropertyService },
        { provide: DataSource, useValue: mockDataSource },
        { provide: DepreciationService, useValue: mockDepreciationService },
      ],
    }).compile();

    service = module.get<TaxService>(TaxService);
  });

  describe('calculate', () => {
    it('returns empty response when user has no properties', async () => {
      (mockPropertyService.search as jest.Mock).mockResolvedValue([]);

      const result = await service.calculate(userWithNoProperties, { year: 2024 });

      expect(result.year).toBe(2024);
      expect(result.grossIncome).toBe(0);
      expect(result.deductions).toBe(0);
      expect(result.depreciation).toBe(0);
      expect(result.netIncome).toBe(0);
      expect(result.breakdown).toEqual([]);
    });

    it('calculates tax for a specific property', async () => {
      const propertyId = 1;
      (mockPropertyService.findOne as jest.Mock).mockResolvedValue({ id: propertyId });
      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ total: '5000' }]) // grossIncome
        .mockResolvedValueOnce([{ category: 'Repairs', amount: '500' }]) // deductions
        .mockResolvedValueOnce({ affectedRows: 1 }) // save stats
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce({ affectedRows: 1 });

      (mockDepreciationService.getYearlyBreakdown as jest.Mock).mockResolvedValue({
        totalDepreciation: 200,
        items: [],
      });

      const result = await service.calculate(testUser, { propertyId, year: 2024 });

      expect(result.year).toBe(2024);
      expect(result.propertyId).toBe(propertyId);
      expect(result.grossIncome).toBe(5000);
      expect(result.deductions).toBe(500);
      expect(result.depreciation).toBe(200);
      expect(result.netIncome).toBe(4300);
      expect(result.calculatedAt).toBeDefined();
    });

    it('calculates tax for all user properties when propertyId not specified', async () => {
      (mockPropertyService.search as jest.Mock).mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]);
      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ total: '10000' }]) // grossIncome
        .mockResolvedValueOnce([
          { category: 'Repairs', amount: '1000' },
          { category: 'Insurance', amount: '500' },
        ]) // deductions
        .mockResolvedValue({ affectedRows: 1 }); // save stats

      (mockDepreciationService.getYearlyBreakdown as jest.Mock).mockResolvedValue({
        totalDepreciation: 300,
        items: [],
      });

      const result = await service.calculate(testUser, { year: 2024 });

      expect(result.grossIncome).toBe(10000);
      expect(result.deductions).toBe(1500);
      expect(result.depreciation).toBe(300);
      expect(result.netIncome).toBe(8200);
    });

    it('returns empty response when specified property not owned by user', async () => {
      (mockPropertyService.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.calculate(testUser, { propertyId: 999, year: 2024 });

      expect(result.grossIncome).toBe(0);
      expect(result.deductions).toBe(0);
      expect(result.depreciation).toBe(0);
      expect(result.netIncome).toBe(0);
    });

    it('includes depreciation breakdown items', async () => {
      const propertyId = 1;
      (mockPropertyService.findOne as jest.Mock).mockResolvedValue({ id: propertyId });
      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ total: '3000' }])
        .mockResolvedValueOnce([])
        .mockResolvedValue({ affectedRows: 1 });

      (mockDepreciationService.getYearlyBreakdown as jest.Mock).mockResolvedValue({
        totalDepreciation: 500,
        items: [
          {
            assetId: 1,
            expenseId: 10,
            description: 'Renovation',
            acquisitionYear: 2023,
            acquisitionMonth: 6,
            originalAmount: 5000,
            depreciationAmount: 500,
            remainingAmount: 4500,
            yearsRemaining: 9,
            isFullyDepreciated: false,
          },
        ],
      });

      const result = await service.calculate(testUser, { propertyId, year: 2024 });

      expect(result.depreciationBreakdown).toHaveLength(1);
      expect(result.depreciationBreakdown[0].assetId).toBe(1);
      expect(result.depreciationBreakdown[0].description).toBe('Renovation');
      expect(result.depreciationBreakdown[0].depreciationAmount).toBe(500);
    });

    it('includes deduction breakdown items', async () => {
      const propertyId = 1;
      (mockPropertyService.findOne as jest.Mock).mockResolvedValue({ id: propertyId });
      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ total: '5000' }])
        .mockResolvedValueOnce([
          { category: 'Repairs', amount: '800' },
          { category: 'Management fees', amount: '200' },
        ])
        .mockResolvedValue({ affectedRows: 1 });

      (mockDepreciationService.getYearlyBreakdown as jest.Mock).mockResolvedValue({
        totalDepreciation: 0,
        items: [],
      });

      const result = await service.calculate(testUser, { propertyId, year: 2024 });

      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown[0].category).toBe('Repairs');
      expect(result.breakdown[0].amount).toBe(800);
      expect(result.breakdown[0].isTaxDeductible).toBe(true);
      expect(result.breakdown[0].isCapitalImprovement).toBe(false);
    });

    it('handles zero gross income', async () => {
      const propertyId = 1;
      (mockPropertyService.findOne as jest.Mock).mockResolvedValue({ id: propertyId });
      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([{ category: 'Repairs', amount: '100' }])
        .mockResolvedValue({ affectedRows: 1 });

      (mockDepreciationService.getYearlyBreakdown as jest.Mock).mockResolvedValue({
        totalDepreciation: 50,
        items: [],
      });

      const result = await service.calculate(testUser, { propertyId, year: 2024 });

      expect(result.grossIncome).toBe(0);
      expect(result.netIncome).toBe(-150);
    });
  });

  describe('get', () => {
    it('returns null when user has no properties', async () => {
      (mockPropertyService.search as jest.Mock).mockResolvedValue([]);

      const result = await service.get(userWithNoProperties, undefined, 2024);

      expect(result).toBeNull();
    });

    it('returns null when no statistics found', async () => {
      (mockPropertyService.search as jest.Mock).mockResolvedValue([{ id: 1 }]);
      mockStatsRepository.find.mockResolvedValue([]);

      const result = await service.get(testUser, undefined, 2024);

      expect(result).toBeNull();
    });

    it('returns saved statistics for a specific property', async () => {
      const propertyId = 1;
      (mockPropertyService.findOne as jest.Mock).mockResolvedValue({ id: propertyId });

      mockStatsRepository.find
        .mockResolvedValueOnce([{ propertyId, year: 2024, key: StatisticKey.TAX_GROSS_INCOME, value: '5000' }])
        .mockResolvedValueOnce([
          { propertyId, year: 2024, key: StatisticKey.TAX_GROSS_INCOME, value: '5000' },
          { propertyId, year: 2024, key: StatisticKey.TAX_DEDUCTIONS, value: '500' },
          { propertyId, year: 2024, key: StatisticKey.TAX_DEPRECIATION, value: '200' },
          { propertyId, year: 2024, key: StatisticKey.TAX_NET_INCOME, value: '4300' },
        ]);

      (mockDataSource.query as jest.Mock).mockResolvedValue([]);
      (mockDepreciationService.getYearlyBreakdown as jest.Mock).mockResolvedValue({
        totalDepreciation: 200,
        items: [],
      });

      const result = await service.get(testUser, propertyId, 2024);

      expect(result.year).toBe(2024);
      expect(result.propertyId).toBe(propertyId);
      expect(result.grossIncome).toBe(5000);
      expect(result.deductions).toBe(500);
      expect(result.depreciation).toBe(200);
      expect(result.netIncome).toBe(4300);
    });

    it('aggregates statistics across multiple properties', async () => {
      (mockPropertyService.search as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);

      mockStatsRepository.find
        .mockResolvedValueOnce([
          { propertyId: 1, year: 2024, key: StatisticKey.TAX_GROSS_INCOME, value: '3000' },
        ])
        .mockResolvedValueOnce([
          { propertyId: 1, year: 2024, key: StatisticKey.TAX_GROSS_INCOME, value: '3000' },
          { propertyId: 1, year: 2024, key: StatisticKey.TAX_DEDUCTIONS, value: '200' },
          { propertyId: 2, year: 2024, key: StatisticKey.TAX_GROSS_INCOME, value: '2000' },
          { propertyId: 2, year: 2024, key: StatisticKey.TAX_DEDUCTIONS, value: '100' },
        ]);

      (mockDataSource.query as jest.Mock).mockResolvedValue([]);
      (mockDepreciationService.getYearlyBreakdown as jest.Mock).mockResolvedValue({
        totalDepreciation: 0,
        items: [],
      });

      const result = await service.get(testUser, undefined, 2024);

      expect(result.grossIncome).toBe(5000);
      expect(result.deductions).toBe(300);
    });

    it('returns null when specified property not owned by user', async () => {
      (mockPropertyService.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.get(testUser, 999, 2024);

      expect(result).toBeNull();
    });

    it('includes live calculated breakdown', async () => {
      const propertyId = 1;
      (mockPropertyService.findOne as jest.Mock).mockResolvedValue({ id: propertyId });

      mockStatsRepository.find
        .mockResolvedValueOnce([{ propertyId, year: 2024, key: StatisticKey.TAX_GROSS_INCOME, value: '5000' }])
        .mockResolvedValueOnce([
          { propertyId, year: 2024, key: StatisticKey.TAX_GROSS_INCOME, value: '5000' },
        ]);

      (mockDataSource.query as jest.Mock).mockResolvedValue([
        { category: 'Insurance', amount: '300' },
      ]);

      (mockDepreciationService.getYearlyBreakdown as jest.Mock).mockResolvedValue({
        totalDepreciation: 0,
        items: [],
      });

      const result = await service.get(testUser, propertyId, 2024);

      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].category).toBe('Insurance');
      expect(result.breakdown[0].amount).toBe(300);
    });
  });
});
