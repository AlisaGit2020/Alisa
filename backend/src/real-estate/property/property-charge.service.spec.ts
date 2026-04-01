import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PropertyChargeService } from './property-charge.service';
import { PropertyCharge } from './entities/property-charge.entity';
import { PropertyService } from './property.service';
import { ChargeType } from '@asset-backend/common/types';
import { createMockRepository, createMockQueryBuilder, MockRepository } from '../../../test/mocks/repository.mock';
import { createJWTUser } from '../../../test/factories/user.factory';
import { createProperty } from '../../../test/factories/property.factory';
import { JWTUser } from '@asset-backend/auth/types';

describe('PropertyChargeService', () => {
  let service: PropertyChargeService;
  let mockRepository: MockRepository<PropertyCharge>;
  let mockPropertyService: Partial<Record<keyof PropertyService, jest.Mock>>;

  const mockUser: JWTUser = createJWTUser({
    id: 1,
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    ownershipInProperties: [1, 2],
  });

  const mockUser2: JWTUser = createJWTUser({
    id: 2,
    email: 'other@test.com',
    firstName: 'Other',
    lastName: 'User',
    ownershipInProperties: [3, 4],
  });

  const mockProperty = createProperty({
    id: 1,
    name: 'Test Property',
  });

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  // Helper to format Date as YYYY-MM-DD string for DTOs
  const formatDate = (date: Date): string => date.toISOString().split('T')[0];
  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(yesterday);
  const tomorrowStr = formatDate(tomorrow);

  const createMockCharge = (
    id: number,
    chargeType: ChargeType,
    amount: number,
    startDate: Date,
    endDate: Date | null = null,
    propertyId: number = 1,
  ): PropertyCharge => {
    const charge = new PropertyCharge();
    charge.id = id;
    charge.propertyId = propertyId;
    charge.chargeType = chargeType;
    charge.amount = amount;
    charge.startDate = startDate;
    charge.endDate = endDate;
    return charge;
  };

  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder<PropertyCharge>>;

  beforeEach(async () => {
    mockQueryBuilder = createMockQueryBuilder<PropertyCharge>();
    mockQueryBuilder.getMany!.mockResolvedValue([]);
    mockRepository = createMockRepository<PropertyCharge>();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockPropertyService = {
      findOne: jest.fn().mockResolvedValue(mockProperty),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyChargeService,
        { provide: getRepositoryToken(PropertyCharge), useValue: mockRepository },
        { provide: PropertyService, useValue: mockPropertyService },
      ],
    }).compile();

    service = module.get<PropertyChargeService>(PropertyChargeService);
  });

  describe('findByProperty', () => {
    it('should return all charges for a property', async () => {
      const mockCharges = [
        createMockCharge(1, ChargeType.MAINTENANCE_FEE, 150, lastMonth, null),
        createMockCharge(2, ChargeType.FINANCIAL_CHARGE, 50, lastMonth, null),
        createMockCharge(3, ChargeType.WATER_PREPAYMENT, 25, lastMonth, null),
      ];
      mockRepository.find.mockResolvedValue(mockCharges);

      const result = await service.findByProperty(mockUser, 1);

      expect(result).toHaveLength(3);
      expect(mockPropertyService.findOne).toHaveBeenCalledWith(mockUser, 1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { propertyId: 1 },
        order: { chargeType: 'ASC', endDate: { direction: 'DESC', nulls: 'FIRST' } },
      });
    });

    it('should throw NotFoundException for non-existent property', async () => {
      mockPropertyService.findOne.mockResolvedValue(null);

      await expect(service.findByProperty(mockUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException for unauthorized user', async () => {
      mockPropertyService.findOne.mockRejectedValue(new UnauthorizedException());

      await expect(service.findByProperty(mockUser2, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getCurrentCharges', () => {
    it('should return charges valid today and calculate total', async () => {
      // Note: TOTAL_CHARGE is not stored in DB, it's calculated from components
      const mockCharges = [
        createMockCharge(1, ChargeType.MAINTENANCE_FEE, 150, lastMonth, null),
        createMockCharge(2, ChargeType.FINANCIAL_CHARGE, 50, lastMonth, null),
        createMockCharge(3, ChargeType.WATER_PREPAYMENT, 25, lastMonth, null),
      ];

      const queryBuilder = mockRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(mockCharges);

      const result = await service.getCurrentCharges(mockUser, 1);

      expect(result).toBeDefined();
      expect(result.maintenanceFee).toBe(150);
      expect(result.financialCharge).toBe(50);
      expect(result.waterPrepayment).toBe(25);
      // totalCharge is calculated: 150 + 50 + 25 = 225
      expect(result.totalCharge).toBe(225);
    });

    it('should calculate total from available charges', async () => {
      const mockCharges = [
        createMockCharge(1, ChargeType.MAINTENANCE_FEE, 150, lastMonth, null),
      ];

      const queryBuilder = mockRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(mockCharges);

      const result = await service.getCurrentCharges(mockUser, 1);

      expect(result).toBeDefined();
      expect(result.maintenanceFee).toBe(150);
      expect(result.financialCharge).toBeNull();
      expect(result.waterPrepayment).toBeNull();
      // totalCharge is calculated from available components: 150
      expect(result.totalCharge).toBe(150);
    });

    it('should include OTHER_CHARGE_BASED in total calculation', async () => {
      const mockCharges = [
        createMockCharge(1, ChargeType.MAINTENANCE_FEE, 100, lastMonth, null),
        createMockCharge(2, ChargeType.FINANCIAL_CHARGE, 50, lastMonth, null),
        createMockCharge(3, ChargeType.WATER_PREPAYMENT, 20, lastMonth, null),
        createMockCharge(4, ChargeType.OTHER_CHARGE_BASED, 30, lastMonth, null),
      ];

      const queryBuilder = mockRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(mockCharges);

      const result = await service.getCurrentCharges(mockUser, 1);

      expect(result.maintenanceFee).toBe(100);
      expect(result.financialCharge).toBe(50);
      expect(result.waterPrepayment).toBe(20);
      expect(result.otherChargeBased).toBe(30);
      // totalCharge includes OTHER_CHARGE_BASED: 100 + 50 + 20 + 30 = 200
      expect(result.totalCharge).toBe(200);
    });

    it('should return zero total when no charges exist', async () => {
      const mockCharges: PropertyCharge[] = [];

      const queryBuilder = mockRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(mockCharges);

      const result = await service.getCurrentCharges(mockUser, 1);

      expect(result.maintenanceFee).toBeNull();
      expect(result.financialCharge).toBeNull();
      expect(result.waterPrepayment).toBeNull();
      expect(result.totalCharge).toBe(0);
    });
  });

  describe('create', () => {
    it('should create a new charge', async () => {
      const input = {
        propertyId: 1,
        chargeType: ChargeType.MAINTENANCE_FEE,
        amount: 150,
        startDate: todayStr,
        endDate: null,
      };

      const savedCharge = createMockCharge(1, ChargeType.MAINTENANCE_FEE, 150, today, null);
      mockRepository.find.mockResolvedValue([]);
      mockRepository.save.mockResolvedValue(savedCharge);
      mockRepository.create.mockReturnValue(savedCharge);

      const result = await service.create(mockUser, input);

      expect(result.id).toBe(1);
      expect(result.amount).toBe(150);
      expect(mockPropertyService.findOne).toHaveBeenCalledWith(mockUser, 1);
    });

    it('should auto-close previous open charge of same type', async () => {
      const previousCharge = createMockCharge(1, ChargeType.MAINTENANCE_FEE, 100, lastMonth, null);
      const input = {
        propertyId: 1,
        chargeType: ChargeType.MAINTENANCE_FEE,
        amount: 150,
        startDate: todayStr,
        endDate: null,
      };

      mockRepository.find.mockResolvedValue([previousCharge]);
      const newCharge = createMockCharge(2, ChargeType.MAINTENANCE_FEE, 150, today, null);
      mockRepository.save.mockResolvedValue(newCharge);
      mockRepository.create.mockReturnValue(newCharge);

      await service.create(mockUser, input);

      // Verify that previous charge endDate was set (day before new charge startDate)
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          endDate: expect.any(Date),
        }),
      );
      // Verify the date is yesterday (ignoring time)
      const savedCall = mockRepository.save.mock.calls.find(
        (call) => call[0].id === 1 && call[0].endDate,
      );
      expect(savedCall).toBeDefined();
      expect(savedCall![0].endDate.toISOString().split('T')[0]).toBe(yesterdayStr);
    });

    it('should throw NotFoundException if property not owned by user', async () => {
      mockPropertyService.findOne.mockResolvedValue(null);

      await expect(
        service.create(mockUser, {
          propertyId: 999,
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: todayStr,
          endDate: null,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update charge amount and dates', async () => {
      const existingCharge = createMockCharge(1, ChargeType.MAINTENANCE_FEE, 100, lastMonth, null);
      mockRepository.findOne.mockResolvedValue(existingCharge);

      const updatedCharge = createMockCharge(1, ChargeType.MAINTENANCE_FEE, 150, lastMonth, tomorrow);
      mockRepository.save.mockResolvedValue(updatedCharge);
      mockQueryBuilder.getMany!.mockResolvedValue([updatedCharge]); // For recalculate

      const result = await service.update(mockUser, 1, 1, {
        amount: 150,
        endDate: tomorrowStr,
      });

      expect(result.amount).toBe(150);
      // DTO returns date as string (YYYY-MM-DD format)
      expect(result.endDate).toBe(tomorrowStr);
    });

    it('should throw NotFoundException for non-existent charge', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockUser, 1, 999, { amount: 150 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when updating charge for another user property', async () => {
      mockPropertyService.findOne.mockRejectedValue(new UnauthorizedException());

      await expect(
        service.update(mockUser2, 1, 1, { amount: 150 }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('delete', () => {
    it('should delete a charge', async () => {
      const existingCharge = createMockCharge(1, ChargeType.MAINTENANCE_FEE, 100, lastMonth, null);
      mockRepository.findOne.mockResolvedValue(existingCharge);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      mockQueryBuilder.getMany!.mockResolvedValue([]); // No remaining charges

      await service.delete(mockUser, 1, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException for non-existent charge', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(mockUser, 1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException when deleting charge for another user property', async () => {
      mockPropertyService.findOne.mockRejectedValue(new UnauthorizedException());

      await expect(service.delete(mockUser2, 1, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getChargeHistory', () => {
    it('should return charge history for a specific charge type', async () => {
      const mockCharges = [
        createMockCharge(1, ChargeType.MAINTENANCE_FEE, 100, new Date('2024-01-01'), new Date('2024-06-30')),
        createMockCharge(2, ChargeType.MAINTENANCE_FEE, 120, new Date('2024-07-01'), new Date('2024-12-31')),
        createMockCharge(3, ChargeType.MAINTENANCE_FEE, 150, new Date('2025-01-01'), null),
      ];

      mockRepository.find.mockResolvedValue(mockCharges);

      const result = await service.getChargeHistory(mockUser, 1, ChargeType.MAINTENANCE_FEE);

      expect(result).toHaveLength(3);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { propertyId: 1, chargeType: ChargeType.MAINTENANCE_FEE },
        order: { startDate: 'DESC' },
      });
    });
  });

  describe('createBatch', () => {
    it('should create multiple charges without storing TOTAL_CHARGE', async () => {
      const inputs = [
        { propertyId: 1, chargeType: ChargeType.MAINTENANCE_FEE, amount: 150, startDate: '2024-01-15' },
        { propertyId: 1, chargeType: ChargeType.FINANCIAL_CHARGE, amount: 50, startDate: '2024-01-15' },
        { propertyId: 1, chargeType: ChargeType.WATER_PREPAYMENT, amount: 25, startDate: '2024-01-15' },
      ];

      const savedCharges = [
        createMockCharge(1, ChargeType.MAINTENANCE_FEE, 150, new Date('2024-01-15'), null),
        createMockCharge(2, ChargeType.FINANCIAL_CHARGE, 50, new Date('2024-01-15'), null),
        createMockCharge(3, ChargeType.WATER_PREPAYMENT, 25, new Date('2024-01-15'), null),
      ];

      // Mock closeOpenCharges finding no existing open charges
      mockRepository.find.mockResolvedValue([]);

      mockRepository.create.mockImplementation((data: Partial<PropertyCharge>) => {
        const charge = new PropertyCharge();
        Object.assign(charge, data);
        return charge;
      });

      let saveCallCount = 0;
      mockRepository.save.mockImplementation(() => {
        return Promise.resolve(savedCharges[saveCallCount++]);
      });

      const result = await service.createBatch(mockUser, 1, inputs);

      // Only component charges are stored, TOTAL_CHARGE is calculated on read
      expect(result).toHaveLength(3);
      expect(result.find(c => c.chargeType === ChargeType.TOTAL_CHARGE)).toBeUndefined();
    });

    it('should skip TOTAL_CHARGE if passed in inputs', async () => {
      const inputs = [
        { propertyId: 1, chargeType: ChargeType.MAINTENANCE_FEE, amount: 100, startDate: '2024-01-15' },
        { propertyId: 1, chargeType: ChargeType.TOTAL_CHARGE, amount: 100, startDate: '2024-01-15' },
      ];

      const savedCharge = createMockCharge(1, ChargeType.MAINTENANCE_FEE, 100, new Date('2024-01-15'), null);

      mockRepository.find.mockResolvedValue([]);
      mockRepository.create.mockImplementation((data: Partial<PropertyCharge>) => {
        const charge = new PropertyCharge();
        Object.assign(charge, data);
        return charge;
      });
      mockRepository.save.mockResolvedValue(savedCharge);

      const result = await service.createBatch(mockUser, 1, inputs);

      // TOTAL_CHARGE input is skipped
      expect(result).toHaveLength(1);
      expect(result[0].chargeType).toBe(ChargeType.MAINTENANCE_FEE);
    });

    it('should allow null startDate', async () => {
      const inputs = [
        { propertyId: 1, chargeType: ChargeType.MAINTENANCE_FEE, amount: 100, startDate: null },
      ];

      const savedCharge = createMockCharge(1, ChargeType.MAINTENANCE_FEE, 100, null, null);

      mockRepository.create.mockImplementation((data: Partial<PropertyCharge>) => {
        const charge = new PropertyCharge();
        Object.assign(charge, data);
        return charge;
      });

      mockRepository.save.mockResolvedValue(savedCharge);

      const result = await service.createBatch(mockUser, 1, inputs);

      expect(result).toHaveLength(1);
      expect(result[0].startDate).toBeNull();
    });

    it('should delete existing charges with same startDate when editing', async () => {
      const inputs = [
        { propertyId: 1, chargeType: ChargeType.MAINTENANCE_FEE, amount: 150, startDate: '2024-01-15' },
      ];

      const savedCharge = createMockCharge(1, ChargeType.MAINTENANCE_FEE, 150, new Date('2024-01-15'), null);

      mockRepository.find.mockResolvedValue([]);
      mockRepository.delete.mockResolvedValue({ affected: 2 });
      mockRepository.create.mockImplementation((data: Partial<PropertyCharge>) => {
        const charge = new PropertyCharge();
        Object.assign(charge, data);
        return charge;
      });
      mockRepository.save.mockResolvedValue(savedCharge);

      await service.createBatch(mockUser, 1, inputs);

      // Verify delete was called with the startDate
      expect(mockRepository.delete).toHaveBeenCalledWith({
        propertyId: 1,
        startDate: new Date('2024-01-15'),
      });
    });

    it('should throw NotFoundException for invalid property', async () => {
      mockPropertyService.findOne.mockResolvedValue(null);

      await expect(
        service.createBatch(mockUser, 999, [{ propertyId: 999, chargeType: ChargeType.MAINTENANCE_FEE, amount: 100, startDate: null }])
      ).rejects.toThrow(NotFoundException);
    });
  });
});
