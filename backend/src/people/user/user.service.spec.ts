import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { createMockRepository, MockRepository } from 'test/mocks';
import { createUser } from 'test/factories';
import { Ownership } from '@alisa-backend/people/ownership/entities/ownership.entity';

describe('UserService', () => {
  let service: UserService;
  let mockRepository: MockRepository<User>;

  beforeEach(async () => {
    mockRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      const users = [
        createUser({ id: 1, email: 'user1@example.com' }),
        createUser({ id: 2, email: 'user2@example.com' }),
      ];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('returns empty array when no users exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('search', () => {
    it('returns users matching search options', async () => {
      const users = [createUser({ id: 1, firstName: 'John' })];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.search({ where: { firstName: 'John' } });

      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { firstName: 'John' },
      });
    });

    it('returns empty array when no users match', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.search({ where: { firstName: 'NonExistent' } });

      expect(result).toEqual([]);
    });

    it('supports relations in search options', async () => {
      const user = createUser({ id: 1 });
      user.ownerships = [];
      mockRepository.find.mockResolvedValue([user]);

      const result = await service.search({ relations: ['ownerships'] });

      expect(result).toEqual([user]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['ownerships'],
      });
    });
  });

  describe('findOne', () => {
    it('returns user when found', async () => {
      const user = createUser({ id: 1 });
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('returns null when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });

    it('supports options parameter', async () => {
      const user = createUser({ id: 1 });
      user.ownerships = [];
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne(1, { relations: ['ownerships'] });

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['ownerships'],
      });
    });
  });

  describe('add', () => {
    it('creates and saves a new user', async () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        language: 'en',
      };
      const savedUser = createUser({ id: 1, ...input });
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await service.add(input);

      expect(result).toEqual(savedUser);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('creates user with optional fields', async () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        photo: 'https://example.com/photo.jpg',
        loanPrincipalExpenseTypeId: 1,
        loanInterestExpenseTypeId: 2,
        loanHandlingFeeExpenseTypeId: 3,
      };
      const savedUser = createUser({ id: 1, ...input });
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await service.add(input);

      expect(result).toEqual(savedUser);
    });
  });

  describe('save', () => {
    it('creates new user when id is not provided', async () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      const savedUser = createUser({ id: 1, ...input });
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await service.save(input);

      expect(result).toEqual(savedUser);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('creates new user when id is 0', async () => {
      const input = {
        id: 0,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      const savedUser = createUser({ id: 1, ...input });
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await service.save(input);

      expect(result).toEqual(savedUser);
    });

    it('updates existing user when id is provided', async () => {
      const existingUser = createUser({ id: 1, firstName: 'John' });
      const input = {
        id: 1,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      };
      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue({ ...existingUser, ...input });

      const result = await service.save(input);

      expect(result.firstName).toBe('Jane');
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('update', () => {
    it('updates existing user', async () => {
      const existingUser = createUser({ id: 1, firstName: 'John' });
      const input = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      };
      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue({ ...existingUser, ...input });

      const result = await service.update(1, input);

      expect(result.firstName).toBe('Jane');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('only updates provided fields', async () => {
      const existingUser = createUser({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });
      const input = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockImplementation((user) => Promise.resolve(user));

      const result = await service.update(1, input);

      expect(result.firstName).toBe('Jane');
      expect(result.email).toBe('john@example.com');
    });

    it('updates loan expense type ids', async () => {
      const existingUser = createUser({ id: 1 });
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        loanPrincipalExpenseTypeId: 10,
        loanInterestExpenseTypeId: 20,
        loanHandlingFeeExpenseTypeId: 30,
      };
      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockImplementation((user) => Promise.resolve(user));

      const result = await service.update(1, input);

      expect(result.loanPrincipalExpenseTypeId).toBe(10);
      expect(result.loanInterestExpenseTypeId).toBe(20);
      expect(result.loanHandlingFeeExpenseTypeId).toBe(30);
    });
  });

  describe('delete', () => {
    it('deletes user by id', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('completes without error when user does not exist', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.delete(999)).resolves.toBeUndefined();
    });
  });

  describe('hasOwnership', () => {
    it('returns true when user owns the property', async () => {
      const user = createUser({ id: 1 });
      const ownership = new Ownership();
      ownership.userId = 1;
      ownership.propertyId = 1;
      ownership.share = 100;
      user.ownerships = [ownership];
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.hasOwnership(1, 1);

      expect(result).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['ownerships'],
      });
    });

    it('returns false when user does not own the property', async () => {
      const user = createUser({ id: 1 });
      const ownership = new Ownership();
      ownership.userId = 1;
      ownership.propertyId = 2;
      ownership.share = 100;
      user.ownerships = [ownership];
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.hasOwnership(1, 1);

      expect(result).toBe(false);
    });

    it('returns false when user has no ownerships', async () => {
      const user = createUser({ id: 1 });
      user.ownerships = [];
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.hasOwnership(1, 1);

      expect(result).toBe(false);
    });

    it('returns false when user ownerships is null', async () => {
      const user = createUser({ id: 1 });
      user.ownerships = null;
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.hasOwnership(1, 1);

      expect(result).toBe(false);
    });

    it('returns false when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.hasOwnership(999, 1);

      expect(result).toBe(false);
    });

    it('returns true when user owns multiple properties including the one queried', async () => {
      const user = createUser({ id: 1 });
      const ownership1 = new Ownership();
      ownership1.userId = 1;
      ownership1.propertyId = 1;
      ownership1.share = 50;
      const ownership2 = new Ownership();
      ownership2.userId = 1;
      ownership2.propertyId = 2;
      ownership2.share = 50;
      user.ownerships = [ownership1, ownership2];
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.hasOwnership(1, 2);

      expect(result).toBe(true);
    });
  });
});
