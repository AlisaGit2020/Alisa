import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpenseTypeService } from './expense-type.service';
import { ExpenseType } from './entities/expense-type.entity';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  createMockRepository,
  createMockAuthService,
  MockRepository,
  MockAuthService,
} from 'test/mocks';
import { createExpenseType, createJWTUser } from 'test/factories';

describe('ExpenseTypeService', () => {
  let service: ExpenseTypeService;
  let mockRepository: MockRepository<ExpenseType>;
  let mockAuthService: MockAuthService;

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
  const otherUser = createJWTUser({ id: 2, ownershipInProperties: [] });

  beforeEach(async () => {
    mockRepository = createMockRepository<ExpenseType>();
    mockAuthService = createMockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseTypeService,
        { provide: getRepositoryToken(ExpenseType), useValue: mockRepository },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<ExpenseTypeService>(ExpenseTypeService);
  });

  describe('findOne', () => {
    it('returns expense type when user owns it', async () => {
      const expenseType = createExpenseType({ id: 1, userId: testUser.id });
      mockRepository.findOne.mockResolvedValue(expenseType);

      const result = await service.findOne(testUser, 1);

      expect(result).toEqual(expenseType);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('returns null when expense type does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(testUser, 999);

      expect(result).toBeNull();
    });

    it('throws UnauthorizedException when user does not own expense type', async () => {
      const expenseType = createExpenseType({ id: 1, userId: testUser.id });
      mockRepository.findOne.mockResolvedValue(expenseType);

      await expect(service.findOne(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('add', () => {
    it('creates a new expense type', async () => {
      const input = {
        name: 'Test expense type',
        description: 'Test description',
        isTaxDeductible: false,
      };
      const savedExpenseType = createExpenseType({
        id: 1,
        userId: testUser.id,
        ...input,
      });

      mockRepository.exist.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(savedExpenseType);

      const result = await service.add(testUser, input);

      expect(result).toEqual(savedExpenseType);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('throws BadRequestException when name already exists for user', async () => {
      const input = {
        name: 'Existing name',
        description: 'Test description',
        isTaxDeductible: false,
      };

      mockRepository.exist.mockResolvedValue(true);

      await expect(service.add(testUser, input)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('updates expense type', async () => {
      const existingExpenseType = createExpenseType({
        id: 1,
        userId: testUser.id,
      });
      const input = {
        name: 'Updated name',
        description: 'Updated description',
        isTaxDeductible: true,
      };

      mockRepository.findOne.mockResolvedValue(existingExpenseType);
      mockRepository.save.mockResolvedValue({ ...existingExpenseType, ...input });

      const result = await service.update(testUser, 1, input);

      expect(result.name).toBe('Updated name');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when expense type does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(testUser, 999, {
          name: 'Test',
          description: '',
          isTaxDeductible: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException when updating another user expense type', async () => {
      const expenseType = createExpenseType({ id: 1, userId: testUser.id });
      mockRepository.findOne.mockResolvedValue(expenseType);

      await expect(
        service.update(otherUser, 1, {
          name: 'Test',
          description: '',
          isTaxDeductible: false,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('delete', () => {
    it('deletes expense type', async () => {
      const expenseType = createExpenseType({ id: 1, userId: testUser.id });
      mockRepository.findOne.mockResolvedValue(expenseType);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(testUser, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when expense type does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(testUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException when deleting another user expense type', async () => {
      const expenseType = createExpenseType({ id: 1, userId: testUser.id });
      mockRepository.findOne.mockResolvedValue(expenseType);

      await expect(service.delete(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('search', () => {
    it('returns user expense types with filter applied', async () => {
      const expenseTypes = [
        createExpenseType({ id: 1, userId: testUser.id, name: 'Type 1' }),
        createExpenseType({ id: 2, userId: testUser.id, name: 'Type 2' }),
      ];
      mockRepository.find.mockResolvedValue(expenseTypes);
      mockAuthService.addUserFilter.mockImplementation((_user, where) => ({
        ...where,
        userId: testUser.id,
      }));

      const result = await service.search(testUser, {});

      expect(result).toEqual(expenseTypes);
      expect(mockAuthService.addUserFilter).toHaveBeenCalled();
    });

    it('returns empty array when user has no expense types', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockAuthService.addUserFilter.mockImplementation((_user, where) => ({
        ...where,
        userId: otherUser.id,
      }));

      const result = await service.search(otherUser, {});

      expect(result).toEqual([]);
    });
  });
});
