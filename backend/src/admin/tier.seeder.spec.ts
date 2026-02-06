import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TierSeeder } from './tier.seeder';
import { Tier } from './entities/tier.entity';
import { createMockRepository, MockRepository } from 'test/mocks';

describe('TierSeeder', () => {
  let seeder: TierSeeder;
  let mockRepository: MockRepository<Tier>;

  beforeEach(async () => {
    mockRepository = createMockRepository<Tier>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TierSeeder,
        { provide: getRepositoryToken(Tier), useValue: mockRepository },
      ],
    }).compile();

    seeder = module.get<TierSeeder>(TierSeeder);
  });

  describe('onModuleInit', () => {
    it('seeds 4 default tiers when table is empty', async () => {
      mockRepository.count.mockResolvedValue(0);
      mockRepository.save.mockResolvedValue([]);

      await seeder.onModuleInit();

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedTiers = mockRepository.save.mock.calls[0][0];
      expect(savedTiers).toHaveLength(4);
    });

    it('does not seed when data already exists', async () => {
      mockRepository.count.mockResolvedValue(4);

      await seeder.onModuleInit();

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('seeds Free tier with isDefault true', async () => {
      mockRepository.count.mockResolvedValue(0);
      mockRepository.save.mockResolvedValue([]);

      await seeder.onModuleInit();

      const savedTiers = mockRepository.save.mock.calls[0][0];
      const freeTier = savedTiers.find((t: Partial<Tier>) => t.name === 'Free');
      expect(freeTier).toBeDefined();
      expect(freeTier.isDefault).toBe(true);
      expect(freeTier.price).toBe(0);
      expect(freeTier.maxProperties).toBe(1);
    });

    it('seeds Enterprise tier with maxProperties 0 (unlimited)', async () => {
      mockRepository.count.mockResolvedValue(0);
      mockRepository.save.mockResolvedValue([]);

      await seeder.onModuleInit();

      const savedTiers = mockRepository.save.mock.calls[0][0];
      const enterpriseTier = savedTiers.find(
        (t: Partial<Tier>) => t.name === 'Enterprise',
      );
      expect(enterpriseTier).toBeDefined();
      expect(enterpriseTier.maxProperties).toBe(0);
      expect(enterpriseTier.price).toBe(29.99);
    });

    it('seeds correct tiers in order', async () => {
      mockRepository.count.mockResolvedValue(0);
      mockRepository.save.mockResolvedValue([]);

      await seeder.onModuleInit();

      const savedTiers = mockRepository.save.mock.calls[0][0];
      expect(savedTiers[0].name).toBe('Free');
      expect(savedTiers[1].name).toBe('Basic');
      expect(savedTiers[2].name).toBe('Professional');
      expect(savedTiers[3].name).toBe('Enterprise');
    });
  });
});
