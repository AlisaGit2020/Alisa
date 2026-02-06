import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TierService } from './tier.service';
import { Tier } from './entities/tier.entity';
import { User } from '@alisa-backend/people/user/entities/user.entity';
import { UserService } from '@alisa-backend/people/user/user.service';
import { createMockRepository, MockRepository } from 'test/mocks';
import { createTier, createFreeTier, createUser } from 'test/factories';

describe('TierService', () => {
  let service: TierService;
  let mockRepository: MockRepository<Tier>;
  let mockUserRepository: MockRepository<User>;
  let mockUserService: Partial<Record<keyof UserService, jest.Mock>>;

  beforeEach(async () => {
    mockRepository = createMockRepository<Tier>();
    mockUserRepository = createMockRepository<User>();
    mockUserService = {
      search: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TierService,
        { provide: getRepositoryToken(Tier), useValue: mockRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<TierService>(TierService);
  });

  describe('findAll', () => {
    it('returns all tiers ordered by sortOrder', async () => {
      const tiers = [
        createTier({ id: 1, name: 'Free', sortOrder: 0 }),
        createTier({ id: 2, name: 'Basic', sortOrder: 1 }),
      ];
      mockRepository.find.mockResolvedValue(tiers);

      const result = await service.findAll();

      expect(result).toEqual(tiers);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { sortOrder: 'ASC', id: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns tier when found', async () => {
      const tier = createFreeTier();
      mockRepository.findOneBy.mockResolvedValue(tier);

      const result = await service.findOne(1);

      expect(result).toEqual(tier);
    });

    it('throws NotFoundException when tier not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findDefault', () => {
    it('returns default tier', async () => {
      const tier = createFreeTier({ isDefault: true });
      mockRepository.findOneBy.mockResolvedValue(tier);

      const result = await service.findDefault();

      expect(result).toEqual(tier);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        isDefault: true,
      });
    });

    it('returns null when no default tier exists', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findDefault();

      expect(result).toBeNull();
    });
  });

  describe('add', () => {
    it('creates a new tier', async () => {
      const input = {
        name: 'Premium',
        price: 9.99,
        maxProperties: 10,
        sortOrder: 1,
        isDefault: false,
      };
      const savedTier = createTier({ id: 5, ...input });
      mockRepository.create.mockReturnValue(savedTier);
      mockRepository.save.mockResolvedValue(savedTier);

      const result = await service.add(input);

      expect(result).toEqual(savedTier);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('clears existing default flag when adding a new default tier', async () => {
      const existingDefault = createFreeTier({ isDefault: true });
      mockRepository.find.mockResolvedValue([existingDefault]);
      mockRepository.save.mockResolvedValue(existingDefault);

      const input = {
        name: 'New Default',
        price: 0,
        maxProperties: 2,
        isDefault: true,
      };
      const savedTier = createTier({ id: 5, ...input });
      mockRepository.create.mockReturnValue(savedTier);
      mockRepository.save.mockResolvedValue(savedTier);

      await service.add(input);

      // Should have been called to clear default, then to save new tier
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('updates an existing tier', async () => {
      const tier = createTier({ id: 1, name: 'Free', price: 0 });
      const input = {
        name: 'Updated Free',
        price: 0,
        maxProperties: 2,
      };
      mockRepository.findOneBy.mockResolvedValue(tier);
      mockRepository.save.mockResolvedValue({ ...tier, ...input });

      const result = await service.update(1, input);

      expect(result.name).toBe('Updated Free');
    });

    it('throws NotFoundException when tier to update not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(999, { name: 'Test', price: 0, maxProperties: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('clears existing default flag when updating tier to default', async () => {
      const tier = createTier({ id: 2, name: 'Basic', isDefault: false });
      const existingDefault = createFreeTier({ isDefault: true });

      mockRepository.findOneBy.mockResolvedValue(tier);
      mockRepository.find.mockResolvedValue([existingDefault]);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.update(2, {
        name: 'Basic',
        price: 4.99,
        maxProperties: 5,
        isDefault: true,
      });

      // Should clear the old default and save the updated tier
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('deletes a tier without assigned users', async () => {
      const tier = createTier({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(tier);
      mockUserService.search.mockResolvedValue([]);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('throws BadRequestException when tier has assigned users', async () => {
      const tier = createTier({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(tier);
      mockUserService.search.mockResolvedValue([createUser({ tierId: 1 })]);

      await expect(service.delete(1)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when tier to delete not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignTierToUser', () => {
    it('assigns tier to user successfully', async () => {
      const tier = createTier({ id: 1 });
      const user = createUser({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(tier);
      mockUserService.findOne.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      await service.assignTierToUser(1, 1);

      expect(mockUserRepository.update).toHaveBeenCalledWith(1, { tierId: 1 });
    });

    it('throws NotFoundException when tier not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.assignTierToUser(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when user not found', async () => {
      const tier = createTier({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(tier);
      mockUserService.findOne.mockResolvedValue(null);

      await expect(service.assignTierToUser(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('canCreateProperty', () => {
    it('returns true when user is under property limit', async () => {
      const tier = createFreeTier({ maxProperties: 5 });
      const user = createUser({ id: 1, tierId: 1 });
      user.tier = tier;
      user.ownerships = [{ propertyId: 1 } as any];

      mockUserService.findOne.mockResolvedValue(user);
      mockUserService.search.mockResolvedValue([user]);

      const result = await service.canCreateProperty(1);

      expect(result).toBe(true);
    });

    it('returns false when user is at property limit', async () => {
      const tier = createFreeTier({ maxProperties: 1 });
      const user = createUser({ id: 1, tierId: 1 });
      user.tier = tier;
      user.ownerships = [{ propertyId: 1 } as any];

      mockUserService.findOne.mockResolvedValue(user);
      mockUserService.search.mockResolvedValue([user]);

      const result = await service.canCreateProperty(1);

      expect(result).toBe(false);
    });

    it('returns true when maxProperties is 0 (unlimited)', async () => {
      const tier = createTier({ id: 4, maxProperties: 0 });
      const user = createUser({ id: 1, tierId: 4 });
      user.tier = tier;
      user.ownerships = Array(100)
        .fill(null)
        .map((_, i) => ({ propertyId: i + 1 }) as any);

      mockUserService.findOne.mockResolvedValue(user);

      const result = await service.canCreateProperty(1);

      expect(result).toBe(true);
    });

    it('uses default tier when user has no tier assigned', async () => {
      const defaultTier = createFreeTier({ maxProperties: 1, isDefault: true });
      const user = createUser({ id: 1 });
      user.tier = undefined;
      user.tierId = undefined;
      user.ownerships = [];

      mockUserService.findOne.mockResolvedValue(user);
      mockRepository.findOneBy.mockResolvedValue(defaultTier);
      mockUserService.search.mockResolvedValue([user]);

      const result = await service.canCreateProperty(1);

      expect(result).toBe(true);
    });

    it('returns true when no tier and no default tier exists', async () => {
      const user = createUser({ id: 1 });
      user.tier = undefined;
      user.tierId = undefined;

      mockUserService.findOne.mockResolvedValue(user);
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.canCreateProperty(1);

      expect(result).toBe(true);
    });
  });
});
