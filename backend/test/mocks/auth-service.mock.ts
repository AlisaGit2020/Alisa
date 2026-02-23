import { AuthService } from '@asset-backend/auth/auth.service';

export type MockAuthService = Partial<Record<keyof AuthService, jest.Mock>>;

export const createMockAuthService = (): MockAuthService => ({
  hasOwnership: jest.fn().mockResolvedValue(true),
  addOwnershipFilter: jest.fn().mockImplementation((_user, where) => where),
  addUserFilter: jest.fn().mockImplementation((_user, where) => {
    if (where === undefined) {
      where = {};
    }
    return where;
  }),
  login: jest.fn(),
  getUserInfo: jest.fn(),
});
