# Backend Testing Guide

This guide explains how to write tests for NestJS services in the Asset backend.

## Overview

We use a two-tier testing strategy:

1. **Unit Tests** - Test services in isolation with mocked dependencies
2. **E2E Tests** - Test full HTTP request/response cycle with real database

## Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (for TDD)
npm run test:watch

# Run specific test file
npm test -- expense.service

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

## Unit Tests

Unit tests live next to the service file:

```
src/accounting/expense/
├── expense.service.ts
└── expense.service.spec.ts
```

### Basic Unit Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpenseService } from './expense.service';
import { Expense } from './entities/expense.entity';
import { AuthService } from '@asset-backend/auth/auth.service';
import {
  createMockRepository,
  createMockAuthService,
  MockRepository,
  MockAuthService,
} from 'test/mocks';
import { createExpense, createJWTUser } from 'test/factories';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let mockRepository: MockRepository<Expense>;
  let mockAuthService: MockAuthService;

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
  const otherUser = createJWTUser({ id: 2, ownershipInProperties: [3, 4] });

  beforeEach(async () => {
    mockRepository = createMockRepository<Expense>();
    mockAuthService = createMockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        { provide: getRepositoryToken(Expense), useValue: mockRepository },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
  });

  describe('findOne', () => {
    it('returns entity when user has ownership', async () => {
      const expense = createExpense({ id: 1, propertyId: 1 });
      mockRepository.findOne.mockResolvedValue(expense);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1);

      expect(result).toEqual(expense);
    });

    it('returns null when entity does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(testUser, 999);

      expect(result).toBeNull();
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const expense = createExpense({ id: 1, propertyId: 1 });
      mockRepository.findOne.mockResolvedValue(expense);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.findOne(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
```

### What to Test in Unit Tests

✅ **DO test:**
- Success cases (happy path)
- Not found errors (404)
- Unauthorized access (401/403)
- Validation errors (400)
- Edge cases (null, empty arrays)
- Authorization/ownership checks

❌ **DON'T test:**
- TypeORM implementation details
- External library behavior
- Database connectivity

## E2E Tests

E2E tests live in the `test/` directory with **controller-based** organization:

```
test/
├── transaction.controller.e2e-spec.ts      # All /accounting/transaction/* endpoints
├── expense.controller.e2e-spec.ts          # All /accounting/expense/* endpoints
├── expense-type.controller.e2e-spec.ts     # All /accounting/expense/type/* endpoints
├── income.controller.e2e-spec.ts           # All /accounting/income/* endpoints
├── income-type.controller.e2e-spec.ts      # All /accounting/income/type/* endpoints
├── property.controller.e2e-spec.ts         # All /real-estate/property/* endpoints
├── tax.controller.e2e-spec.ts              # All /real-estate/property/tax/* endpoints
├── investment.controller.e2e-spec.ts       # All /real-estate/investment/* endpoints
├── auth.controller.e2e-spec.ts             # All /auth/* endpoints
├── admin.controller.e2e-spec.ts            # All /admin/* endpoints
├── op-import.controller.e2e-spec.ts        # POST /import/op
├── s-pankki-import.controller.e2e-spec.ts  # POST /import/s-pankki
├── google.controller.e2e-spec.ts           # All /google/* endpoints
├── helper-functions.ts                     # Helper functions
└── jest-e2e.json                           # Jest configuration
```

### E2E Test File Naming Convention

Each controller has its own E2E test file that covers ALL endpoints:

- **Pattern:** `<controller-name>.controller.e2e-spec.ts`
- **Location:** `backend/test/`
- **Coverage:** Every API endpoint in the controller must be tested

Examples:
- `transaction.controller.e2e-spec.ts` tests all `/accounting/transaction/*` endpoints
- `property.controller.e2e-spec.ts` tests all `/real-estate/property/*` endpoints

Every E2E test file must include tests for:
- Authentication (valid token, invalid token, no token)
- Authorization (own data vs. other users' data)
- All CRUD operations
- Response status codes (200, 201, 400, 401, 403, 404)
- Response body structure validation

### Basic E2E Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@asset-backend/auth/auth.service';
import {
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUsersSetup,
} from './helper-functions';
import * as http from 'http';

describe('Expense endpoints (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let testUsers: TestUsersSetup;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    authService = app.get(AuthService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe('GET /accounting/expense/:id', () => {
    it('returns expense when user has ownership', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .get('/accounting/expense/1')
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.id).toBe(1);
    });

    it('returns 401 when accessing without ownership', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);

      // Try to access user2's expense with user1's token
      await request(server)
        .get('/accounting/expense/999')
        .set('Authorization', getBearerToken(token1))
        .expect(401);
    });

    it('returns 404 when expense does not exist', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      await request(server)
        .get('/accounting/expense/99999')
        .set('Authorization', getBearerToken(token))
        .expect(404);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .get('/accounting/expense/1')
        .expect(401);
    });
  });
});
```

### What to Test in E2E Tests

✅ **DO test:**
- Full HTTP request/response cycle
- Authentication (valid token, invalid token, no token)
- Authorization (own data vs. other users' data)
- Response status codes
- Response body structure
- CRUD operations

❌ **DON'T test:**
- Internal service logic (covered in unit tests)
- Every possible input combination

## Test Utilities

### Mock Utilities (`test/mocks/`)

```typescript
import {
  createMockRepository,
  createMockAuthService,
  createMockQueryBuilder,
  MockRepository,
  MockAuthService,
} from 'test/mocks';
```

#### `createMockRepository<T>()`
Creates a mock TypeORM repository with all common methods:
- `find`, `findOne`, `findOneBy`
- `save`, `delete`, `remove`, `create`, `update`
- `count`, `exist`
- `createQueryBuilder` (returns mock query builder)

```typescript
const mockRepo = createMockRepository<Expense>();
mockRepo.findOne.mockResolvedValue(expense);
mockRepo.save.mockResolvedValue(savedExpense);
```

#### `createMockAuthService()`
Creates a mock AuthService with common methods:
- `hasOwnership` - defaults to `true`
- `addOwnershipFilter` - passes through unchanged
- `addUserFilter` - passes through unchanged
- `login`, `getUserInfo`

```typescript
const mockAuth = createMockAuthService();
mockAuth.hasOwnership.mockResolvedValue(false);  // Simulate no access
```

#### `createMockQueryBuilder<T>()`
Creates a mock SelectQueryBuilder for complex queries:
- `select`, `addSelect`, `leftJoin`, `innerJoin`
- `where`, `andWhere`, `orWhere`
- `orderBy`, `addOrderBy`, `limit`, `offset`
- `getOne`, `getMany`, `getRawOne`, `getRawMany`

### Test Data Factories (`test/factories/`)

```typescript
import {
  createJWTUser,
  createUser,
  createProperty,
  createTransaction,
  createExpenseTransaction,
  createIncomeTransaction,
  createDepositTransaction,
  createWithdrawTransaction,
  createExpense,
  createExpenseType,
  createIncome,
  createIncomeType,
  createInvestment,
  createTier,
} from 'test/factories';
```

#### User Factories

```typescript
// Create JWT user (for authentication)
const user = createJWTUser({
  id: 1,
  ownershipInProperties: [1, 2],
  isAdmin: false,
});

// Create User entity (for database)
const userEntity = createUser({
  id: 1,
  email: 'test@example.com',
});

// Pre-defined test users
import {
  testUserWithProperties,
  testUserWithoutProperties,
  testUser2WithProperties,
} from 'test/factories';
```

#### Entity Factories

```typescript
// Property
const property = createProperty({
  id: 1,
  name: 'Test Apartment',
  size: 50,
});

// Transaction with type helpers
const income = createIncomeTransaction({ amount: 1000, propertyId: 1 });
const expense = createExpenseTransaction({ amount: 500, propertyId: 1 });
const deposit = createDepositTransaction({ amount: 5000 });
const withdraw = createWithdrawTransaction({ amount: 200 });

// Expense
const expense = createExpense({
  propertyId: 1,
  expenseTypeId: 1,
  totalAmount: 100,
});

// ExpenseType
const expenseType = createExpenseType({
  name: 'Repairs',
  isTaxDeductible: true,
});
```

### E2E Helper Functions (`test/helper-functions.ts`)

```typescript
import {
  getUserAccessToken,
  getUserAccessToken2,
  getBearerToken,
  emptyTables,
  prepareDatabase,
  getTestUsers,
  addProperty,
  addExpenseType,
  addIncomeType,
  addTransaction,
  addTransactionsToTestUsers,
  addIncomeAndExpenseTypes,
  addTier,
  closeAppGracefully,
  sleep,
  TestUsersSetup,
  TestUser,
} from './helper-functions';
```

#### Authentication Helpers

```typescript
// Get access token for user
const token = await getUserAccessToken2(authService, user.jwtUser);

// Create Bearer token header
const authHeader = getBearerToken(token);

// Use in request
request(server)
  .get('/endpoint')
  .set('Authorization', authHeader)
```

#### Database Setup

```typescript
// Clear all tables before tests
await prepareDatabase(app);

// Clear specific tables
await emptyTables(dataSource, ['expense', 'income']);

// Get pre-configured test users with properties
const testUsers = await getTestUsers(app);
// testUsers.userWithoutProperties
// testUsers.user1WithProperties
// testUsers.user2WithProperties
```

#### Test Data Setup

```typescript
// Add a property
const property = await addProperty(propertyService, 'Test Property', 50, user);

// Add expense/income types
await addExpenseTypes(user, app);
await addIncomeTypes(user, app);
await addIncomeAndExpenseTypes(user, app);

// Add transactions to test users
await addTransactionsToTestUsers(app, testUsers);
```

#### Cleanup

```typescript
afterAll(async () => {
  // Properly close app and wait for async operations
  await closeAppGracefully(app, server);
});
```

## Common Test Patterns

### Testing Authorization

```typescript
describe('authorization', () => {
  it('allows access to own data', async () => {
    mockAuthService.hasOwnership.mockResolvedValue(true);
    const result = await service.findOne(testUser, 1);
    expect(result).toBeDefined();
  });

  it('denies access to others data', async () => {
    mockAuthService.hasOwnership.mockResolvedValue(false);
    await expect(service.findOne(otherUser, 1)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
```

### Testing CRUD Operations

```typescript
describe('CRUD', () => {
  describe('create', () => {
    it('creates entity when valid input', async () => {
      const input = { name: 'Test', propertyId: 1 };
      mockRepository.save.mockResolvedValue({ id: 1, ...input });

      const result = await service.add(testUser, input);

      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('updates existing entity', async () => {
      const existing = createEntity({ id: 1 });
      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue({ ...existing, name: 'Updated' });

      const result = await service.update(testUser, 1, { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('throws NotFoundException when entity not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(testUser, 999, { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes existing entity', async () => {
      const existing = createEntity({ id: 1 });
      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(testUser, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
```

### Testing Search/Filter

```typescript
describe('search', () => {
  it('applies ownership filter', async () => {
    const entities = [createEntity(), createEntity()];
    mockRepository.find.mockResolvedValue(entities);

    const result = await service.search(testUser, {});

    expect(mockAuthService.addOwnershipFilter).toHaveBeenCalled();
    expect(result).toEqual(entities);
  });

  it('returns empty array for user without data', async () => {
    mockRepository.find.mockResolvedValue([]);

    const result = await service.search(userWithoutProperties, {});

    expect(result).toEqual([]);
  });
});
```

## TDD Workflow

### For New Services

1. **Write the test first** (RED)
   ```typescript
   it('creates entity', async () => {
     const result = await service.add(testUser, input);
     expect(result.id).toBeDefined();
   });
   ```

2. **Run test to see it fail**
   ```bash
   npm test -- --watch service.name
   ```

3. **Write minimal code to pass** (GREEN)

4. **Refactor and repeat**

### For Bug Fixes

1. **Write test that reproduces bug** (RED)
2. **Verify test fails** (confirms bug exists)
3. **Fix the code** (GREEN)
4. **Test passes** (bug won't regress)

## Best Practices

1. **Test behavior, not implementation** - Test what the service does, not how
2. **Keep tests independent** - Each test should work in isolation
3. **Use descriptive test names** - `it('throws NotFoundException when entity not found')`
4. **Group related tests** - Use `describe` blocks for each method
5. **Test edge cases** - Empty arrays, null values, boundary conditions
6. **Mock external dependencies** - Don't let tests depend on external services
7. **Clean up after tests** - Use `beforeEach`/`afterEach` for setup/teardown
8. **Test authorization** - Always verify ownership checks work correctly

## Troubleshooting

### "Cannot find module 'test/mocks'"
Ensure `tsconfig.json` has the path mapping:
```json
{
  "compilerOptions": {
    "paths": {
      "test/*": ["./test/*"]
    }
  }
}
```

### E2E Test Database Issues
```typescript
// Always clean database before tests
await prepareDatabase(app);

// Use closeAppGracefully to wait for async operations
await closeAppGracefully(app, server);
```

### Async Event Handling
For tests involving events:
```typescript
const eventTracker = app.get(EventTrackerService);
await eventTracker.waitForPending();
```

## Examples

See existing tests for reference:
- Unit test: `src/accounting/expense/expense.service.spec.ts`
- E2E test: `test/transaction.controller.e2e-spec.ts`
- Factories: `test/factories/transaction.factory.ts`
- Mocks: `test/mocks/repository.mock.ts`
