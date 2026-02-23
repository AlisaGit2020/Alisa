import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { UserService } from '@asset-backend/people/user/user.service';
import { createUser } from 'test/factories';

describe('AdminService', () => {
  let service: AdminService;
  let mockUserService: Partial<Record<keyof UserService, jest.Mock>>;

  beforeEach(async () => {
    mockUserService = {
      findAll: jest.fn(),
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  describe('findAllUsers', () => {
    it('returns all users from repository', async () => {
      const users = [
        createUser({ id: 1, firstName: 'John', lastName: 'Doe' }),
        createUser({ id: 2, firstName: 'Jane', lastName: 'Smith' }),
      ];
      mockUserService.search.mockResolvedValue(users);

      const result = await service.findAllUsers();

      expect(result).toEqual(users);
      expect(mockUserService.search).toHaveBeenCalledWith({
        relations: { tier: true },
      });
    });

    it('returns empty array when no users exist', async () => {
      mockUserService.search.mockResolvedValue([]);

      const result = await service.findAllUsers();

      expect(result).toEqual([]);
    });
  });
});
