import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaxDeductionService } from './tax-deduction.service';
import { TaxDeduction } from './entities/tax-deduction.entity';
import { PropertyService } from './property.service';
import { PropertyStatisticsService } from './property-statistics.service';
import { TaxDeductionType } from '@asset-backend/common/types';
import { JWTUser } from '@asset-backend/auth/types';

describe('TaxDeductionService', () => {
  let service: TaxDeductionService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRepository: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPropertyService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockStatisticsService: any;

  const mockUser: JWTUser = {
    id: 1,
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    language: 'en',
    ownershipInProperties: [],
    isAdmin: false,
  };
  const mockProperty = { id: 1, name: 'Test Property', distanceFromHome: 25.0, isAirbnb: true };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((data) => data),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    mockPropertyService = {
      findOne: jest.fn().mockResolvedValue(mockProperty),
      search: jest.fn().mockResolvedValue([mockProperty]),
    };

    mockStatisticsService = {
      searchAll: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxDeductionService,
        { provide: getRepositoryToken(TaxDeduction), useValue: mockRepository },
        { provide: PropertyService, useValue: mockPropertyService },
        { provide: PropertyStatisticsService, useValue: mockStatisticsService },
      ],
    }).compile();

    service = module.get<TaxDeductionService>(TaxDeductionService);
  });

  describe('calculateTravelDeduction', () => {
    it('should calculate travel amount correctly', () => {
      const result = service.calculateTravelDeduction(25.0, 24, 2025);
      // Round trip: 25 * 2 = 50km, 50 * 24 visits * 0.30 rate = 360
      expect(result.amount).toBe(360);
      expect(result.ratePerKm).toBe(0.30);
    });
  });

  describe('calculateLaundryDeduction', () => {
    it('should use default price when not specified', () => {
      const result = service.calculateLaundryDeduction(24);
      // 24 visits * 3.00 = 72
      expect(result.amount).toBe(72);
      expect(result.pricePerLaundry).toBe(3.0);
    });

    it('should use custom price when specified', () => {
      const result = service.calculateLaundryDeduction(24, 5.0);
      // 24 visits * 5.00 = 120
      expect(result.amount).toBe(120);
      expect(result.pricePerLaundry).toBe(5.0);
    });
  });

  describe('create', () => {
    it('should create a travel deduction', async () => {
      const input = {
        propertyId: 1,
        year: 2025,
        deductionType: TaxDeductionType.TRAVEL,
        amount: 360,
        metadata: { distanceKm: 25, visits: 24, ratePerKm: 0.30 },
      };

      mockRepository.save.mockResolvedValue({ id: 1, ...input, description: null, property: null });

      const result = await service.create(mockUser, input);
      expect(result.id).toBe(1);
      expect(mockPropertyService.findOne).toHaveBeenCalledWith(mockUser, 1);
    });

    it('should throw if property not owned by user', async () => {
      mockPropertyService.findOne.mockResolvedValue(null);

      await expect(service.create(mockUser, {
        propertyId: 999,
        year: 2025,
        deductionType: TaxDeductionType.CUSTOM,
        amount: 100,
      })).rejects.toThrow();
    });
  });

  describe('findByPropertyAndYear', () => {
    it('should return deductions for property and year', async () => {
      const mockDeductions = [
        { id: 1, propertyId: 1, year: 2025, deductionType: TaxDeductionType.TRAVEL, amount: 360, description: null, metadata: null, property: null },
      ];
      mockRepository.find.mockResolvedValue(mockDeductions);

      const result = await service.findByPropertyAndYear(mockUser, 1, 2025);
      expect(result).toHaveLength(1);
    });
  });
});
