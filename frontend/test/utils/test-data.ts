// frontend/test/utils/test-data.ts
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { User } from '@alisa-backend/people/user/entities/user.entity';

/**
 * Creates a mock Property for testing
 */
export const createMockProperty = (overrides?: Partial<Property>): Property => {
  return {
    id: 1,
    name: 'Test Property',
    address: '123 Test Street',
    postalCode: '00100',
    city: 'Helsinki',
    country: 'Finland',
    propertyType: 'APARTMENT',
    purchasePrice: 250000,
    purchaseDate: new Date('2020-01-01'),
    currentValue: 275000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Property;
};

/**
 * Creates a mock Transaction for testing
 */
export const createMockTransaction = (overrides?: Partial<Transaction>): Transaction => {
  return {
    id: 1,
    amount: 1000,
    date: new Date('2024-01-01'),
    description: 'Test Transaction',
    type: 'INCOME',
    category: 'RENT',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Transaction;
};

/**
 * Creates a mock User for testing
 */
export const createMockUser = (overrides?: Partial<User>): User => {
  return {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
};
