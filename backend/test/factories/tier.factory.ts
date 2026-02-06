import { Tier } from '@alisa-backend/admin/entities/tier.entity';

export interface CreateTierOptions {
  id?: number;
  name?: string;
  price?: number;
  maxProperties?: number;
  sortOrder?: number;
  isDefault?: boolean;
}

export const createTier = (options: CreateTierOptions = {}): Tier => {
  const tier = new Tier();
  tier.id = options.id ?? 1;
  tier.name = options.name ?? 'Free';
  tier.price = options.price ?? 0;
  tier.maxProperties = options.maxProperties ?? 1;
  tier.sortOrder = options.sortOrder ?? 0;
  tier.isDefault = options.isDefault ?? false;
  return tier;
};

export const createFreeTier = (overrides: Partial<CreateTierOptions> = {}): Tier =>
  createTier({ id: 1, name: 'Free', price: 0, maxProperties: 1, sortOrder: 0, isDefault: true, ...overrides });

export const createBasicTier = (overrides: Partial<CreateTierOptions> = {}): Tier =>
  createTier({ id: 2, name: 'Basic', price: 4.99, maxProperties: 5, sortOrder: 1, ...overrides });

export const createProfessionalTier = (overrides: Partial<CreateTierOptions> = {}): Tier =>
  createTier({ id: 3, name: 'Professional', price: 14.99, maxProperties: 20, sortOrder: 2, ...overrides });

export const createEnterpriseTier = (overrides: Partial<CreateTierOptions> = {}): Tier =>
  createTier({ id: 4, name: 'Enterprise', price: 29.99, maxProperties: 0, sortOrder: 3, ...overrides });
