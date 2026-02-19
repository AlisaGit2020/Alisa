// frontend/test/utils/test-data.ts
import { Property, Transaction, User, TransactionStatus, TransactionType } from '@alisa-types';
import { AxiosError, AxiosHeaders } from 'axios';

/**
 * Creates a mock Property for testing
 */
export const createMockProperty = (overrides?: Partial<Property>): Property => {
  return {
    id: 1,
    name: 'Test Property',
    address: {
      id: 1,
      street: '123 Test Street',
      postalCode: '00100',
      city: 'Helsinki',
    },
    size: 50,
    ownerships: [],
    ...overrides,
  } as Property;
};

/**
 * Creates a mock Transaction for testing
 */
export const createMockTransaction = (overrides?: Partial<Transaction>): Transaction => {
  return {
    id: 1,
    externalId: 'ext-001',
    status: TransactionStatus.PENDING,
    type: TransactionType.INCOME,
    sender: 'Test Sender',
    receiver: 'Test Receiver',
    description: 'Test Transaction',
    transactionDate: new Date('2024-01-01'),
    accountingDate: new Date('2024-01-01'),
    amount: 1000,
    balance: 5000,
    propertyId: 1,
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
    ...overrides,
  } as User;
};

/**
 * Creates a mock AxiosError for testing server-side validation errors
 */
export const createAxiosError = (status: number, messages: string[]): AxiosError => {
  const error = new AxiosError('Request failed');
  error.response = {
    status,
    data: { message: messages },
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
};
