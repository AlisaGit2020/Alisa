import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OwnershipService } from './ownership.service';
import { Ownership } from './entities/ownership.entity';
import { createMockRepository, MockRepository } from 'test/mocks';

describe('OwnershipService', () => {
  let service: OwnershipService;
  let mockRepository: MockRepository<Ownership>;

  const createOwnership = (options: Partial<Ownership> = {}): Ownership => {
    const ownership = new Ownership();
    ownership.id = options.id ?? 1;
    ownership.userId = options.userId ?? 1;
    ownership.propertyId = options.propertyId ?? 1;
    ownership.share = options.share ?? 100;
    return ownership;
  };

  beforeEach(async () => {
    mockRepository = createMockRepository<Ownership>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnershipService,
        { provide: getRepositoryToken(Ownership), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<OwnershipService>(OwnershipService);
  });

  describe('findAll', () => {
    it('returns all ownerships', async () => {
      const ownerships = [
        createOwnership({ id: 1, userId: 1, propertyId: 1 }),
        createOwnership({ id: 2, userId: 2, propertyId: 2 }),
      ];
      mockRepository.find.mockResolvedValue(ownerships);

      const result = await service.findAll();

      expect(result).toEqual(ownerships);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('returns empty array when no ownerships exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('search', () => {
    it('returns ownerships matching search options', async () => {
      const ownerships = [createOwnership({ id: 1, userId: 1 })];
      mockRepository.find.mockResolvedValue(ownerships);

      const result = await service.search({ where: { userId: 1 } });

      expect(result).toEqual(ownerships);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('returns empty array when no ownerships match', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.search({ where: { userId: 999 } });

      expect(result).toEqual([]);
    });

    it('supports relations in search options', async () => {
      const ownership = createOwnership({ id: 1 });
      mockRepository.find.mockResolvedValue([ownership]);

      const result = await service.search({ relations: ['user', 'property'] });

      expect(result).toEqual([ownership]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['user', 'property'],
      });
    });

    it('supports filtering by propertyId', async () => {
      const ownerships = [
        createOwnership({ id: 1, propertyId: 1 }),
        createOwnership({ id: 2, propertyId: 1 }),
      ];
      mockRepository.find.mockResolvedValue(ownerships);

      const result = await service.search({ where: { propertyId: 1 } });

      expect(result).toHaveLength(2);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { propertyId: 1 },
      });
    });
  });

  describe('findOne', () => {
    it('returns ownership when found', async () => {
      const ownership = createOwnership({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(ownership);

      const result = await service.findOne(1);

      expect(result).toEqual(ownership);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('returns null when ownership not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('add', () => {
    it('creates and saves a new ownership', async () => {
      const input = {
        userId: 1,
        propertyId: 1,
        share: 100,
      };
      const savedOwnership = createOwnership({ id: 1, ...input });
      mockRepository.save.mockResolvedValue(savedOwnership);

      const result = await service.add(input);

      expect(result).toEqual(savedOwnership);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('creates ownership with partial share', async () => {
      const input = {
        userId: 1,
        propertyId: 1,
        share: 50,
      };
      const savedOwnership = createOwnership({ id: 1, ...input });
      mockRepository.save.mockResolvedValue(savedOwnership);

      const result = await service.add(input);

      expect(result.share).toBe(50);
    });

    it('creates ownership for different users on same property', async () => {
      const input1 = { userId: 1, propertyId: 1, share: 50 };
      const input2 = { userId: 2, propertyId: 1, share: 50 };

      const savedOwnership1 = createOwnership({ id: 1, ...input1 });
      const savedOwnership2 = createOwnership({ id: 2, ...input2 });

      mockRepository.save
        .mockResolvedValueOnce(savedOwnership1)
        .mockResolvedValueOnce(savedOwnership2);

      const result1 = await service.add(input1);
      const result2 = await service.add(input2);

      expect(result1.userId).toBe(1);
      expect(result2.userId).toBe(2);
      expect(result1.propertyId).toBe(result2.propertyId);
    });
  });

  describe('update', () => {
    it('updates existing ownership', async () => {
      const existingOwnership = createOwnership({ id: 1, share: 100 });
      const input = {
        userId: 1,
        propertyId: 1,
        share: 75,
      };
      mockRepository.findOneBy.mockResolvedValue(existingOwnership);
      mockRepository.save.mockResolvedValue({ ...existingOwnership, ...input });

      const result = await service.update(1, input);

      expect(result.share).toBe(75);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('only updates provided fields', async () => {
      const existingOwnership = createOwnership({
        id: 1,
        userId: 1,
        propertyId: 1,
        share: 100,
      });
      const input = {
        userId: 1,
        share: 50,
      };
      mockRepository.findOneBy.mockResolvedValue(existingOwnership);
      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update(1, input);

      expect(result.share).toBe(50);
      expect(result.propertyId).toBe(1);
    });

    it('updates userId when changing ownership', async () => {
      const existingOwnership = createOwnership({ id: 1, userId: 1 });
      const input = {
        userId: 2,
        propertyId: 1,
        share: 100,
      };
      mockRepository.findOneBy.mockResolvedValue(existingOwnership);
      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update(1, input);

      expect(result.userId).toBe(2);
    });
  });

  describe('delete', () => {
    it('deletes ownership by id', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('completes without error when ownership does not exist', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.delete(999)).resolves.toBeUndefined();
    });
  });

  describe('mapData', () => {
    it('skips undefined values when mapping', async () => {
      const existingOwnership = createOwnership({
        id: 1,
        userId: 1,
        propertyId: 1,
        share: 100,
      });
      const input = {
        userId: 1,
        share: 75,
        propertyId: undefined,
      };
      mockRepository.findOneBy.mockResolvedValue(existingOwnership);
      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update(1, input);

      expect(result.share).toBe(75);
      expect(result.propertyId).toBe(1);
    });
  });
});
