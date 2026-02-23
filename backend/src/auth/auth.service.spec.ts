import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../people/user/user.service';
import { TierService } from '@asset-backend/admin/tier.service';
import { createUser, createJWTUser } from 'test/factories';
import { Ownership } from '@asset-backend/people/ownership/entities/ownership.entity';
import { FindOptionsWhereWithUserId } from '@asset-backend/common/types';

describe('AuthService', () => {
  let service: AuthService;
  let mockJwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let mockUserService: Partial<Record<keyof UserService, jest.Mock>>;
  let mockTierService: Partial<Record<keyof TierService, jest.Mock>>;

  beforeEach(async () => {
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    mockUserService = {
      add: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      search: jest.fn(),
      hasOwnership: jest.fn(),
      save: jest.fn(),
    };

    mockTierService = {
      findDefault: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserService, useValue: mockUserService },
        { provide: TierService, useValue: mockTierService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('creates new user when user does not exist', async () => {
      const userInput = {
        email: 'test@email.com',
        firstName: 'Test',
        lastName: 'Tester',
        language: 'fi',
        photo: 'http://localhost/photo.png',
      };

      const savedUser = createUser({ id: 1, ...userInput });
      savedUser.ownerships = [];

      mockUserService.search
        .mockResolvedValueOnce([]) // First call - user doesn't exist
        .mockResolvedValueOnce([savedUser]) // After creation
        .mockResolvedValueOnce([savedUser]); // Final search with relations

      mockUserService.add.mockResolvedValue(savedUser);

      const result = await service.login(userInput);

      expect(result).toBe('mock-jwt-token');
      expect(mockUserService.add).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it('updates existing user on re-login but excludes language', async () => {
      const userInput = {
        email: 'test@email.com',
        firstName: 'Updated',
        lastName: 'Name',
        language: 'en',
        photo: 'http://localhost/photo2.png',
      };

      const existingUser = createUser({ id: 1, email: userInput.email, language: 'fi' });
      existingUser.ownerships = [];

      mockUserService.search.mockResolvedValue([existingUser]);
      mockUserService.update.mockResolvedValue(existingUser);

      const result = await service.login(userInput);

      expect(result).toBe('mock-jwt-token');
      // Language should NOT be in the update call - it should be excluded to preserve user preference
      expect(mockUserService.update).toHaveBeenCalledWith(1, {
        email: 'test@email.com',
        firstName: 'Updated',
        lastName: 'Name',
        photo: 'http://localhost/photo2.png',
      });
    });

    it('includes ownership in JWT token', async () => {
      const userInput = {
        email: 'test@email.com',
        firstName: 'Test',
        lastName: 'Tester',
      };

      const existingUser = createUser({ id: 1, ...userInput });
      existingUser.ownerships = [
        { propertyId: 1, userId: 1, share: 100 },
        { propertyId: 2, userId: 1, share: 50 },
      ] as Ownership[];

      mockUserService.search.mockResolvedValue([existingUser]);
      mockUserService.update.mockResolvedValue(existingUser);

      await service.login(userInput);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          ownershipInProperties: [1, 2],
          isAdmin: false,
        }),
      );
    });
  });

  describe('hasOwnership', () => {
    it('returns true when user has ownership', async () => {
      const user = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
      mockUserService.hasOwnership.mockResolvedValue(true);

      const result = await service.hasOwnership(user, 1);

      expect(result).toBe(true);
      expect(mockUserService.hasOwnership).toHaveBeenCalledWith(1, 1);
    });

    it('returns false when user has no ownership', async () => {
      const user = createJWTUser({ id: 1, ownershipInProperties: [] });
      mockUserService.hasOwnership.mockResolvedValue(false);

      const result = await service.hasOwnership(user, 1);

      expect(result).toBe(false);
    });

    it('returns false when propertyId is undefined', async () => {
      const user = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });

      const result = await service.hasOwnership(user, undefined);

      expect(result).toBe(false);
    });
  });

  describe('addOwnershipFilter', () => {
    it('adds ownership filter to empty where clause', () => {
      const user = createJWTUser({ id: 1 });

      const result = service.addOwnershipFilter(user, undefined);

      expect(result).toEqual({
        property: {
          ownerships: [{ userId: 1 }],
        },
      });
    });

    it('adds ownership filter to existing where clause', () => {
      const user = createJWTUser({ id: 1 });
      const where = { propertyId: 1 };

      const result = service.addOwnershipFilter(user, where);

      expect(result).toEqual({
        propertyId: 1,
        property: {
          ownerships: [{ userId: 1 }],
        },
      });
    });

    it('handles array of where clauses', () => {
      const user = createJWTUser({ id: 1 });
      const where = [{ propertyId: 1 }, { propertyId: 2 }];

      const result = service.addOwnershipFilter(user, where);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('property.ownerships');
      expect(result[1]).toHaveProperty('property.ownerships');
    });
  });

  describe('addUserFilter', () => {
    it('adds userId to empty where clause', () => {
      const user = createJWTUser({ id: 1 });

      const result = service.addUserFilter(user, undefined as unknown as FindOptionsWhereWithUserId<unknown>);

      expect(result).toEqual({ userId: 1 });
    });

    it('adds userId to existing where clause', () => {
      const user = createJWTUser({ id: 1 });
      const where = { name: 'Test', userId: 0 } as FindOptionsWhereWithUserId<{ name: string; userId: number }>;

      const result = service.addUserFilter(user, where);

      expect(result).toEqual({
        name: 'Test',
        userId: 1,
      });
    });

    it('handles array of where clauses', () => {
      const user = createJWTUser({ id: 1 });
      const where = [{ name: 'A', userId: 0 }, { name: 'B', userId: 0 }] as FindOptionsWhereWithUserId<{ name: string; userId: number }>[];

      const result = service.addUserFilter(user, where);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('userId', 1);
      expect(result[1]).toHaveProperty('userId', 1);
    });
  });

  describe('getUserInfo', () => {
    it('returns user when found', async () => {
      const user = createUser({ id: 1, email: 'test@email.com' });
      mockUserService.search.mockResolvedValue([user]);

      const result = await service.getUserInfo('test@email.com');

      expect(result).toEqual(user);
    });

    it('returns undefined when user not found', async () => {
      mockUserService.search.mockResolvedValue([]);

      const result = await service.getUserInfo('notfound@email.com');

      expect(result).toBeUndefined();
    });
  });

  describe('updateUserSettings', () => {
    it('updates user language', async () => {
      const user = createUser({ id: 1, language: 'fi' });
      mockUserService.findOne.mockResolvedValue(user);
      mockUserService.save.mockResolvedValue({ ...user, language: 'en' });

      const result = await service.updateUserSettings(1, { language: 'en' });

      expect(result.language).toBe('en');
      expect(mockUserService.save).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'en' }),
      );
    });

    it('returns null when user not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      const result = await service.updateUserSettings(999, { language: 'en' });

      expect(result).toBeNull();
      expect(mockUserService.save).not.toHaveBeenCalled();
    });
  });
});
