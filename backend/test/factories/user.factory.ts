import { JWTUser } from '@alisa-backend/auth/types';
import { User } from '@alisa-backend/people/user/entities/user.entity';

export interface CreateJWTUserOptions {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  language?: string;
  ownershipInProperties?: number[];
  isAdmin?: boolean;
}

export const createJWTUser = (options: CreateJWTUserOptions = {}): JWTUser => ({
  id: options.id ?? 1,
  firstName: options.firstName ?? 'Test',
  lastName: options.lastName ?? 'User',
  email: options.email ?? 'test@example.com',
  language: options.language ?? 'fi',
  ownershipInProperties: options.ownershipInProperties ?? [1, 2],
  isAdmin: options.isAdmin ?? false,
});

export interface CreateUserOptions {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  language?: string;
  photo?: string;
  isAdmin?: boolean;
}

export const createUser = (options: CreateUserOptions = {}): User => {
  const user = new User();
  user.id = options.id ?? 1;
  user.firstName = options.firstName ?? 'Test';
  user.lastName = options.lastName ?? 'User';
  user.email = options.email ?? 'test@example.com';
  user.language = options.language ?? 'fi';
  user.photo = options.photo ?? 'https://example.com/photo.jpg';
  user.isAdmin = options.isAdmin ?? false;
  user.ownerships = [];
  return user;
};

// Pre-defined test users for common scenarios
export const testUserWithProperties = createJWTUser({
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@doe.com',
  ownershipInProperties: [1, 2],
});

export const testUserWithoutProperties = createJWTUser({
  id: 2,
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@smith.com',
  ownershipInProperties: [],
});

export const testUser2WithProperties = createJWTUser({
  id: 3,
  firstName: 'Bob',
  lastName: 'Wilson',
  email: 'bob@wilson.com',
  ownershipInProperties: [3, 4],
});
