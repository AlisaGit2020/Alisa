import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tier } from './entities/tier.entity';

const DEFAULT_TIERS: Partial<Tier>[] = [
  {
    name: 'Free',
    price: 0,
    maxProperties: 1,
    sortOrder: 0,
    isDefault: true,
  },
  {
    name: 'Basic',
    price: 4.99,
    maxProperties: 5,
    sortOrder: 1,
    isDefault: false,
  },
  {
    name: 'Professional',
    price: 14.99,
    maxProperties: 20,
    sortOrder: 2,
    isDefault: false,
  },
  {
    name: 'Enterprise',
    price: 29.99,
    maxProperties: 0,
    sortOrder: 3,
    isDefault: false,
  },
];

@Injectable()
export class TierSeeder implements OnModuleInit {
  private readonly logger = new Logger(TierSeeder.name);

  constructor(
    @InjectRepository(Tier)
    private repository: Repository<Tier>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedTiers();
  }

  private async seedTiers(): Promise<void> {
    const count = await this.repository.count();
    if (count > 0) {
      return;
    }

    this.logger.log('Seeding default tiers...');
    await this.repository.save(DEFAULT_TIERS);
    this.logger.log(`Seeded ${DEFAULT_TIERS.length} default tiers`);
  }
}
