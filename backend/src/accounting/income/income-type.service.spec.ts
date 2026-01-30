import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IncomeTypeService } from './income-type.service';
import { IncomeType } from './entities/income-type.entity';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  createMockRepository,
  createMockAuthService,
  MockRepository,
  MockAuthService,
} from 'test/mocks';
import { createIncomeType, createJWTUser } from 'test/factories';

describe('IncomeTypeService', () => {
  let service: IncomeTypeService;
  let mockRepository: MockRepository<IncomeType>;
  let mockAuthService: MockAuthService;

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
  const otherUser = createJWTUser({ id: 2, ownershipInProperties: [] });

  beforeEach(async () => {
    mockRepository = createMockRepository<IncomeType>();
    mockAuthService = createMockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomeTypeService,
        { provide: getRepositoryToken(IncomeType), useValue: mockRepository },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<IncomeTypeService>(IncomeTypeService);
  });

  describe('findOne', () => {
    it('returns income type when user owns it', async () => {
      const incomeType = createIncomeType({ id: 1, userId: testUser.id });
      mockRepository.findOne.mockResolvedValue(incomeType);

      const result = await service.findOne(testUser, 1);

      expect(result).toEqual(incomeType);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('returns null when income type does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(testUser, 999);

      expect(result).toBeNull();
    });

    it('throws UnauthorizedException when user does not own income type', async () => {
      const incomeType = createIncomeType({ id: 1, userId: testUser.id });
      mockRepository.findOne.mockResolvedValue(incomeType);

      await expect(service.findOne(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('add', () => {
    it('creates a new income type', async () => {
      const input = {
        name: 'Test income type',
        description: 'Test description',
      };
      const savedIncomeType = createIncomeType({
        id: 1,
        userId: testUser.id,
        ...input,
      });

      mockRepository.exist.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(savedIncomeType);

      const result = await service.add(testUser, input);

      expect(result).toEqual(savedIncomeType);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('throws BadRequestException when name already exists for user', async () => {
      const input = {
        name: 'Existing name',
        description: 'Test description',
      };

      mockRepository.exist.mockResolvedValue(true);

      await expect(service.add(testUser, input)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('updates income type', async () => {
      const existingIncomeType = createIncomeType({
        id: 1,
        userId: testUser.id,
      });
      const input = {
        name: 'Updated name',
        description: 'Updated description',
      };

      mockRepository.findOne.mockResolvedValue(existingIncomeType);
      mockRepository.save.mockResolvedValue({ ...existingIncomeType, ...input });

      const result = await service.update(testUser, 1, input);

      expect(result.name).toBe('Updated name');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when income type does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(testUser, 999, { name: 'Test', description: '' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException when updating another user income type', async () => {
      const incomeType = createIncomeType({ id: 1, userId: testUser.id });
      mockRepository.findOne.mockResolvedValue(incomeType);

      await expect(
        service.update(otherUser, 1, { name: 'Test', description: '' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('delete', () => {
    it('deletes income type', async () => {
      const incomeType = createIncomeType({ id: 1, userId: testUser.id });
      mockRepository.findOne.mockResolvedValue(incomeType);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(testUser, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when income type does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(testUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException when deleting another user income type', async () => {
      const incomeType = createIncomeType({ id: 1, userId: testUser.id });
      mockRepository.findOne.mockResolvedValue(incomeType);

      await expect(service.delete(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('search', () => {
    it('returns user income types with filter applied', async () => {
      const incomeTypes = [
        createIncomeType({ id: 1, userId: testUser.id, name: 'Type 1' }),
        createIncomeType({ id: 2, userId: testUser.id, name: 'Type 2' }),
      ];
      mockRepository.find.mockResolvedValue(incomeTypes);
      mockAuthService.addUserFilter.mockImplementation((_user, where) => ({
        ...where,
        userId: testUser.id,
      }));

      const result = await service.search(testUser, {});

      expect(result).toEqual(incomeTypes);
      expect(mockAuthService.addUserFilter).toHaveBeenCalled();
    });

    it('returns empty array when user has no income types', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockAuthService.addUserFilter.mockImplementation((_user, where) => ({
        ...where,
        userId: otherUser.id,
      }));

      const result = await service.search(otherUser, {});

      expect(result).toEqual([]);
    });

    it('handles undefined options', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockAuthService.addUserFilter.mockImplementation((_user, where) => ({
        ...where,
        userId: testUser.id,
      }));

      const result = await service.search(testUser, undefined);

      expect(result).toEqual([]);
    });
  });
});
