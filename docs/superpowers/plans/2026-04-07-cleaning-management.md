# Cleaning Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cleaning tracking and payment management for Airbnb properties with role-based access (admin, owner, cleaner).

**Architecture:** Extend User entity with a `roles` array column replacing `isAdmin`. New `Cleaning` and `PropertyCleaner` entities in a new `cleaning/` backend module. Two new frontend views: admin monthly cleaning page and cleaner dashboard.

**Tech Stack:** NestJS + TypeORM (backend), React + MUI + AssetDataTable (frontend), PostgreSQL array column for roles.

**Spec:** `docs/superpowers/specs/2026-04-07-cleaning-management-design.md`

---

### Task 1: UserRole Enum and Roles Guard

Add the UserRole enum to shared types and create a reusable RolesGuard + Roles decorator.

**Files:**
- Modify: `backend/src/common/types.ts`
- Create: `backend/src/auth/roles.guard.ts`
- Create: `backend/src/auth/roles.guard.spec.ts`
- Create: `backend/src/auth/roles.decorator.ts`

- [ ] **Step 1: Add UserRole enum to common types**

In `backend/src/common/types.ts`, add at the end of the file:

```typescript
// User roles
export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  CLEANER = 'cleaner',
}
```

- [ ] **Step 2: Write failing test for RolesGuard**

Create `backend/src/auth/roles.guard.spec.ts`:

```typescript
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@asset-backend/common/types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockContext = (user: { roles?: string[] } | null): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ roles: [UserRole.OWNER] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ roles: [UserRole.ADMIN, UserRole.OWNER] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ roles: [UserRole.CLEANER] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user has no roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ roles: [] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows when user has any one of multiple required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN, UserRole.OWNER]);
    const context = createMockContext({ roles: [UserRole.OWNER] });
    expect(guard.canActivate(context)).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npx jest src/auth/roles.guard.spec.ts --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 4: Create Roles decorator**

Create `backend/src/auth/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@asset-backend/common/types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 5: Implement RolesGuard**

Create `backend/src/auth/roles.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@asset-backend/common/types';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userRoles: UserRole[] = user?.roles ?? [];

    if (!requiredRoles.some((role) => userRoles.includes(role))) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && npx jest src/auth/roles.guard.spec.ts --no-coverage`
Expected: PASS — all 5 tests pass

- [ ] **Step 7: Commit**

```bash
git add backend/src/common/types.ts backend/src/auth/roles.guard.ts backend/src/auth/roles.guard.spec.ts backend/src/auth/roles.decorator.ts
git commit -m "feat: add UserRole enum, RolesGuard, and Roles decorator"
```

---

### Task 2: Update User Entity and JWT to Use Roles

Replace `isAdmin: boolean` with `roles: UserRole[]` in the User entity and JWTUser type. Update AdminGuard and all references.

**Files:**
- Modify: `backend/src/people/user/entities/user.entity.ts`
- Modify: `backend/src/auth/types.ts`
- Modify: `backend/src/auth/jwt.strategy.ts`
- Modify: `backend/src/admin/admin.guard.ts`
- Modify: `backend/src/admin/admin.guard.spec.ts` (if exists, or create)
- Modify: `backend/test/factories/user.factory.ts`

- [ ] **Step 1: Update User entity**

In `backend/src/people/user/entities/user.entity.ts`:

Replace:
```typescript
  @Column({ default: false })
  isAdmin: boolean;
```

With:
```typescript
  @Column({ type: 'text', array: true, default: '{owner}' })
  roles: UserRole[];
```

Add import at top:
```typescript
import { UserRole } from '@asset-backend/common/types';
```

- [ ] **Step 2: Update JWTUser type**

In `backend/src/auth/types.ts`, replace `isAdmin: boolean;` with `roles: UserRole[];` and add the import for `UserRole` from `@asset-backend/common/types`.

- [ ] **Step 3: Update JWT strategy**

Find the JWT strategy file (likely `backend/src/auth/jwt.strategy.ts` or similar). In the `validate()` method that builds the JWTUser payload, replace `isAdmin: user.isAdmin` with `roles: user.roles ?? [UserRole.OWNER]`. Add UserRole import.

Also update the Google OAuth callback or wherever JWTUser is constructed — search for all places that set `isAdmin` on JWTUser and replace with `roles`.

- [ ] **Step 4: Update AdminGuard to use roles**

In `backend/src/admin/admin.guard.ts`, replace:
```typescript
    if (!user?.isAdmin) {
```
With:
```typescript
    const roles: UserRole[] = user?.roles ?? [];
    if (!roles.includes(UserRole.ADMIN)) {
```

Add import: `import { UserRole } from '@asset-backend/common/types';`

- [ ] **Step 5: Update test factories**

In `backend/test/factories/user.factory.ts`, update `createJWTUser()` and `createUser()`:
- Replace `isAdmin: false` (or `true`) defaults with `roles: [UserRole.OWNER]`
- For admin test users, use `roles: [UserRole.ADMIN, UserRole.OWNER]`
- Add UserRole import

- [ ] **Step 6: Fix all remaining isAdmin references**

Search the entire backend for `isAdmin` references and update them:
- Service files that check `user.isAdmin` → check `user.roles.includes(UserRole.ADMIN)`
- E2E test helpers that set `isAdmin` on test users → set `roles` array
- Any DTOs or response objects that expose `isAdmin`

Run: `cd backend && grep -rn "isAdmin" src/ test/ --include="*.ts" | grep -v node_modules | grep -v ".spec.ts"`

Fix each occurrence.

- [ ] **Step 7: Run all backend tests**

Run: `cd backend && npm test`
Expected: All existing tests pass (some may need `isAdmin` → `roles` updates in test files)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: replace isAdmin with roles array on User entity"
```

---

### Task 3: Property CleaningBruttoPrice and PropertyCleaner Entity

Add `cleaningBruttoPrice` to Property and create the PropertyCleaner join table.

**Files:**
- Modify: `backend/src/real-estate/property/entities/property.entity.ts`
- Create: `backend/src/cleaning/entities/property-cleaner.entity.ts`
- Create: `backend/src/cleaning/property-cleaner.service.ts`
- Create: `backend/src/cleaning/property-cleaner.service.spec.ts`

- [ ] **Step 1: Add cleaningBruttoPrice to Property entity**

In `backend/src/real-estate/property/entities/property.entity.ts`, add after `distanceFromHome`:

```typescript
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: new DecimalToNumberTransformer(),
  })
  public cleaningBruttoPrice?: number;
```

- [ ] **Step 2: Create PropertyCleaner entity**

Create `backend/src/cleaning/entities/property-cleaner.entity.ts`:

```typescript
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '@asset-backend/people/user/entities/user.entity';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';

@Entity()
export class PropertyCleaner {
  @ManyToOne(() => Property, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @PrimaryColumn()
  propertyId: number;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @PrimaryColumn()
  userId: number;
}
```

- [ ] **Step 3: Write failing test for PropertyCleanerService**

Create `backend/src/cleaning/property-cleaner.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PropertyCleanerService } from './property-cleaner.service';
import { PropertyCleaner } from './entities/property-cleaner.entity';
import { AuthService } from '@asset-backend/auth/auth.service';
import { UserRole } from '@asset-backend/common/types';
import { createMockRepository, MockRepository } from '../../test/mocks/repository.mock';
import { createMockAuthService, MockAuthService } from '../../test/mocks/auth-service.mock';
import { createJWTUser } from '../../test/factories/user.factory';

describe('PropertyCleanerService', () => {
  let service: PropertyCleanerService;
  let repository: MockRepository<PropertyCleaner>;
  let authService: MockAuthService;

  const adminUser = createJWTUser({ id: 1, roles: [UserRole.ADMIN, UserRole.OWNER], ownershipInProperties: [10] });

  beforeEach(async () => {
    repository = createMockRepository<PropertyCleaner>();
    authService = createMockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyCleanerService,
        { provide: getRepositoryToken(PropertyCleaner), useValue: repository },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = module.get<PropertyCleanerService>(PropertyCleanerService);
  });

  describe('findByProperty', () => {
    it('returns cleaners for a property the user owns', async () => {
      authService.hasOwnership.mockResolvedValue(true);
      const cleaners = [{ propertyId: 10, userId: 2 }];
      repository.find.mockResolvedValue(cleaners);

      const result = await service.findByProperty(adminUser, 10);

      expect(result).toEqual(cleaners);
      expect(authService.hasOwnership).toHaveBeenCalledWith(adminUser, 10);
    });

    it('throws UnauthorizedException when user does not own property', async () => {
      authService.hasOwnership.mockResolvedValue(false);

      await expect(service.findByProperty(adminUser, 99)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('assign', () => {
    it('assigns a cleaner to a property', async () => {
      authService.hasOwnership.mockResolvedValue(true);
      const saved = { propertyId: 10, userId: 2 };
      repository.save.mockResolvedValue(saved);

      const result = await service.assign(adminUser, 10, 2);

      expect(result).toEqual(saved);
      expect(repository.save).toHaveBeenCalledWith({ propertyId: 10, userId: 2 });
    });

    it('throws UnauthorizedException when user does not own property', async () => {
      authService.hasOwnership.mockResolvedValue(false);

      await expect(service.assign(adminUser, 99, 2)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('remove', () => {
    it('removes a cleaner from a property', async () => {
      authService.hasOwnership.mockResolvedValue(true);
      repository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove(adminUser, 10, 2);

      expect(repository.delete).toHaveBeenCalledWith({ propertyId: 10, userId: 2 });
    });
  });

  describe('getPropertiesForCleaner', () => {
    it('returns properties assigned to a cleaner', async () => {
      const assignments = [
        { propertyId: 10, userId: 2, property: { id: 10, name: 'Test', cleaningBruttoPrice: 80 } },
      ];
      repository.find.mockResolvedValue(assignments);

      const result = await service.getPropertiesForCleaner(2);

      expect(result).toEqual(assignments);
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 2 },
        relations: { property: true },
      });
    });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd backend && npx jest src/cleaning/property-cleaner.service.spec.ts --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 5: Implement PropertyCleanerService**

Create `backend/src/cleaning/property-cleaner.service.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyCleaner } from './entities/property-cleaner.entity';
import { AuthService } from '@asset-backend/auth/auth.service';
import { JWTUser } from '@asset-backend/auth/types';

@Injectable()
export class PropertyCleanerService {
  constructor(
    @InjectRepository(PropertyCleaner)
    private readonly repository: Repository<PropertyCleaner>,
    private readonly authService: AuthService,
  ) {}

  async findByProperty(user: JWTUser, propertyId: number): Promise<PropertyCleaner[]> {
    await this.verifyOwnership(user, propertyId);
    return this.repository.find({
      where: { propertyId },
      relations: { user: true },
    });
  }

  async assign(user: JWTUser, propertyId: number, userId: number): Promise<PropertyCleaner> {
    await this.verifyOwnership(user, propertyId);
    return this.repository.save({ propertyId, userId });
  }

  async remove(user: JWTUser, propertyId: number, userId: number): Promise<void> {
    await this.verifyOwnership(user, propertyId);
    await this.repository.delete({ propertyId, userId });
  }

  async getPropertiesForCleaner(userId: number): Promise<PropertyCleaner[]> {
    return this.repository.find({
      where: { userId },
      relations: { property: true },
    });
  }

  async isCleanerAssigned(userId: number, propertyId: number): Promise<boolean> {
    const count = await this.repository.count({ where: { userId, propertyId } });
    return count > 0;
  }

  private async verifyOwnership(user: JWTUser, propertyId: number): Promise<void> {
    const hasOwnership = await this.authService.hasOwnership(user, propertyId);
    if (!hasOwnership) {
      throw new UnauthorizedException();
    }
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && npx jest src/cleaning/property-cleaner.service.spec.ts --no-coverage`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/real-estate/property/entities/property.entity.ts backend/src/cleaning/
git commit -m "feat: add cleaningBruttoPrice to Property, create PropertyCleaner entity and service"
```

---

### Task 4: Cleaning Entity, Service, and Controller

Core cleaning CRUD with authorization — cleaners add their own, admins view/delete on owned properties.

**Files:**
- Create: `backend/src/cleaning/entities/cleaning.entity.ts`
- Create: `backend/src/cleaning/cleaning.service.ts`
- Create: `backend/src/cleaning/cleaning.service.spec.ts`
- Create: `backend/src/cleaning/cleaning.controller.ts`
- Create: `backend/src/cleaning/dtos/cleaning-input.dto.ts`
- Create: `backend/src/cleaning/cleaning.module.ts`

- [ ] **Step 1: Create Cleaning entity**

Create `backend/src/cleaning/entities/cleaning.entity.ts`:

```typescript
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@asset-backend/people/user/entities/user.entity';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';

@Entity()
export class Cleaning {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @ManyToOne(() => Property, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  propertyId: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'int' })
  percentage: number;
}
```

- [ ] **Step 2: Create CleaningInputDto**

Create `backend/src/cleaning/dtos/cleaning-input.dto.ts`:

```typescript
import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

const toNumber = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? Number(value) : value;

export class CleaningInputDto {
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @Transform(toNumber)
  propertyId: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(toNumber)
  percentage: number = 100;
}
```

- [ ] **Step 3: Write failing test for CleaningService**

Create `backend/src/cleaning/cleaning.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { CleaningService } from './cleaning.service';
import { Cleaning } from './entities/cleaning.entity';
import { PropertyCleanerService } from './property-cleaner.service';
import { AuthService } from '@asset-backend/auth/auth.service';
import { UserRole } from '@asset-backend/common/types';
import { createMockRepository, MockRepository } from '../../test/mocks/repository.mock';
import { createMockAuthService, MockAuthService } from '../../test/mocks/auth-service.mock';
import { createJWTUser } from '../../test/factories/user.factory';

describe('CleaningService', () => {
  let service: CleaningService;
  let repository: MockRepository<Cleaning>;
  let authService: MockAuthService;
  let propertyCleanerService: { isCleanerAssigned: jest.Mock; getPropertiesForCleaner: jest.Mock };

  const cleanerUser = createJWTUser({ id: 2, roles: [UserRole.CLEANER] });
  const adminUser = createJWTUser({ id: 1, roles: [UserRole.ADMIN, UserRole.OWNER], ownershipInProperties: [10] });

  beforeEach(async () => {
    repository = createMockRepository<Cleaning>();
    authService = createMockAuthService();
    propertyCleanerService = {
      isCleanerAssigned: jest.fn(),
      getPropertiesForCleaner: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleaningService,
        { provide: getRepositoryToken(Cleaning), useValue: repository },
        { provide: AuthService, useValue: authService },
        { provide: PropertyCleanerService, useValue: propertyCleanerService },
      ],
    }).compile();

    service = module.get<CleaningService>(CleaningService);
  });

  describe('addCleaning', () => {
    it('creates a cleaning when cleaner is assigned to property', async () => {
      propertyCleanerService.isCleanerAssigned.mockResolvedValue(true);
      const saved = { id: 1, date: '2026-04-07', propertyId: 10, userId: 2, percentage: 100 };
      repository.save.mockResolvedValue(saved);

      const result = await service.addCleaning(cleanerUser, {
        date: '2026-04-07',
        propertyId: 10,
        percentage: 100,
      });

      expect(result).toEqual(saved);
      expect(propertyCleanerService.isCleanerAssigned).toHaveBeenCalledWith(2, 10);
    });

    it('throws UnauthorizedException when cleaner is not assigned', async () => {
      propertyCleanerService.isCleanerAssigned.mockResolvedValue(false);

      await expect(
        service.addCleaning(cleanerUser, { date: '2026-04-07', propertyId: 99, percentage: 100 }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findByProperty', () => {
    it('returns cleanings for a property filtered by month/year', async () => {
      authService.hasOwnership.mockResolvedValue(true);
      const cleanings = [
        { id: 1, date: '2026-04-07', propertyId: 10, userId: 2, percentage: 100 },
      ];
      repository.createQueryBuilder = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(cleanings),
      });

      const result = await service.findByProperty(adminUser, 10, 4, 2026);

      expect(result).toEqual(cleanings);
    });

    it('throws UnauthorizedException when user does not own property', async () => {
      authService.hasOwnership.mockResolvedValue(false);

      await expect(service.findByProperty(adminUser, 99, 4, 2026)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('findByCleanerUser', () => {
    it('returns cleanings for the authenticated cleaner', async () => {
      const cleanings = [
        { id: 1, date: '2026-04-07', propertyId: 10, userId: 2, percentage: 100 },
      ];
      repository.find.mockResolvedValue(cleanings);

      const result = await service.findByCleanerUser(cleanerUser);

      expect(result).toEqual(cleanings);
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 2 } }),
      );
    });
  });

  describe('deleteCleaning', () => {
    it('allows cleaner to delete own cleaning', async () => {
      const cleaning = { id: 1, propertyId: 10, userId: 2, percentage: 100 };
      repository.findOne.mockResolvedValue(cleaning);
      repository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.deleteCleaning(cleanerUser, 1);

      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('allows admin to delete any cleaning on owned property', async () => {
      const cleaning = { id: 1, propertyId: 10, userId: 2, percentage: 100 };
      repository.findOne.mockResolvedValue(cleaning);
      authService.hasOwnership.mockResolvedValue(true);
      repository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.deleteCleaning(adminUser, 1);

      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('throws UnauthorizedException when cleaner tries to delete others cleaning', async () => {
      const cleaning = { id: 1, propertyId: 10, userId: 99, percentage: 100 };
      repository.findOne.mockResolvedValue(cleaning);
      authService.hasOwnership.mockResolvedValue(false);

      await expect(service.deleteCleaning(cleanerUser, 1)).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd backend && npx jest src/cleaning/cleaning.service.spec.ts --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 5: Implement CleaningService**

Create `backend/src/cleaning/cleaning.service.ts`:

```typescript
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cleaning } from './entities/cleaning.entity';
import { PropertyCleanerService } from './property-cleaner.service';
import { AuthService } from '@asset-backend/auth/auth.service';
import { JWTUser } from '@asset-backend/auth/types';
import { UserRole } from '@asset-backend/common/types';
import { CleaningInputDto } from './dtos/cleaning-input.dto';

@Injectable()
export class CleaningService {
  constructor(
    @InjectRepository(Cleaning)
    private readonly repository: Repository<Cleaning>,
    private readonly propertyCleanerService: PropertyCleanerService,
    private readonly authService: AuthService,
  ) {}

  async addCleaning(user: JWTUser, input: CleaningInputDto): Promise<Cleaning> {
    const isAssigned = await this.propertyCleanerService.isCleanerAssigned(user.id, input.propertyId);
    if (!isAssigned) {
      throw new UnauthorizedException('Not assigned to this property');
    }

    return this.repository.save({
      date: input.date,
      propertyId: input.propertyId,
      userId: user.id,
      percentage: input.percentage,
    });
  }

  async findByProperty(user: JWTUser, propertyId: number, month: number, year: number): Promise<Cleaning[]> {
    const hasOwnership = await this.authService.hasOwnership(user, propertyId);
    if (!hasOwnership) {
      throw new UnauthorizedException();
    }

    return this.repository
      .createQueryBuilder('cleaning')
      .where('cleaning.propertyId = :propertyId', { propertyId })
      .andWhere('EXTRACT(MONTH FROM cleaning.date) = :month', { month })
      .andWhere('EXTRACT(YEAR FROM cleaning.date) = :year', { year })
      .leftJoinAndSelect('cleaning.user', 'user')
      .orderBy('cleaning.date', 'DESC')
      .getMany();
  }

  async findByCleanerUser(user: JWTUser): Promise<Cleaning[]> {
    return this.repository.find({
      where: { userId: user.id },
      relations: { property: true },
      order: { date: 'DESC' },
    });
  }

  async deleteCleaning(user: JWTUser, id: number): Promise<void> {
    const cleaning = await this.repository.findOne({ where: { id } });
    if (!cleaning) {
      throw new NotFoundException('Cleaning not found');
    }

    const isOwn = cleaning.userId === user.id;
    const isAdmin = user.roles.includes(UserRole.ADMIN);
    const ownsProperty = isAdmin && await this.authService.hasOwnership(user, cleaning.propertyId);

    if (!isOwn && !ownsProperty) {
      throw new UnauthorizedException();
    }

    await this.repository.delete(id);
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && npx jest src/cleaning/cleaning.service.spec.ts --no-coverage`
Expected: PASS

- [ ] **Step 7: Create CleaningController**

Create `backend/src/cleaning/cleaning.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@asset-backend/auth/jwt.auth.guard';
import { RolesGuard } from '@asset-backend/auth/roles.guard';
import { Roles } from '@asset-backend/auth/roles.decorator';
import { User } from '@asset-backend/common/decorators/user.decorator';
import { JWTUser } from '@asset-backend/auth/types';
import { UserRole } from '@asset-backend/common/types';
import { CleaningService } from './cleaning.service';
import { PropertyCleanerService } from './property-cleaner.service';
import { CleaningInputDto } from './dtos/cleaning-input.dto';

@Controller('cleaning')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CleaningController {
  constructor(
    private readonly cleaningService: CleaningService,
    private readonly propertyCleanerService: PropertyCleanerService,
  ) {}

  // Cleaner endpoints
  @Post()
  @Roles(UserRole.CLEANER)
  addCleaning(@User() user: JWTUser, @Body() input: CleaningInputDto) {
    return this.cleaningService.addCleaning(user, input);
  }

  @Get('my')
  @Roles(UserRole.CLEANER)
  getMyCleaning(@User() user: JWTUser) {
    return this.cleaningService.findByCleanerUser(user);
  }

  // Admin/Owner endpoints
  @Get('property/:propertyId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  getByProperty(
    @User() user: JWTUser,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.cleaningService.findByProperty(user, propertyId, month, year);
  }

  @Delete(':id')
  deleteCleaning(@User() user: JWTUser, @Param('id', ParseIntPipe) id: number) {
    return this.cleaningService.deleteCleaning(user, id);
  }

  // Property cleaner management (admin only)
  @Get('property/:propertyId/cleaners')
  @Roles(UserRole.ADMIN)
  getCleaners(@User() user: JWTUser, @Param('propertyId', ParseIntPipe) propertyId: number) {
    return this.propertyCleanerService.findByProperty(user, propertyId);
  }

  @Post('property/:propertyId/cleaners')
  @Roles(UserRole.ADMIN)
  assignCleaner(
    @User() user: JWTUser,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.propertyCleanerService.assign(user, propertyId, userId);
  }

  @Delete('property/:propertyId/cleaners/:userId')
  @Roles(UserRole.ADMIN)
  removeCleaner(
    @User() user: JWTUser,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.propertyCleanerService.remove(user, propertyId, userId);
  }
}
```

- [ ] **Step 8: Create CleaningModule**

Create `backend/src/cleaning/cleaning.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cleaning } from './entities/cleaning.entity';
import { PropertyCleaner } from './entities/property-cleaner.entity';
import { CleaningService } from './cleaning.service';
import { PropertyCleanerService } from './property-cleaner.service';
import { CleaningController } from './cleaning.controller';
import { AuthModule } from '@asset-backend/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cleaning, PropertyCleaner]),
    AuthModule,
  ],
  controllers: [CleaningController],
  providers: [CleaningService, PropertyCleanerService],
  exports: [CleaningService, PropertyCleanerService],
})
export class CleaningModule {}
```

- [ ] **Step 9: Register CleaningModule in AppModule**

In `backend/src/app.module.ts`, import `CleaningModule` and add it to the `imports` array.

- [ ] **Step 10: Run all backend tests**

Run: `cd backend && npm test`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add backend/src/cleaning/ backend/src/app.module.ts
git commit -m "feat: add Cleaning entity, service, controller, and module"
```

---

### Task 5: Cleaner User Management Endpoint

Allow admins to create cleaner accounts and list their cleaners.

**Files:**
- Modify: `backend/src/people/user/user.service.ts`
- Modify: `backend/src/cleaning/cleaning.controller.ts`
- Create: `backend/src/cleaning/dtos/create-cleaner.dto.ts`

- [ ] **Step 1: Create CreateCleanerDto**

Create `backend/src/cleaning/dtos/create-cleaner.dto.ts`:

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateCleanerDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;
}
```

- [ ] **Step 2: Add cleaner creation method to UserService**

In `backend/src/people/user/user.service.ts`, add a method (check existing methods first):

```typescript
async createCleaner(dto: { email: string; firstName: string; lastName: string }): Promise<User> {
  const existing = await this.repository.findOne({ where: { email: dto.email } });
  if (existing) {
    throw new BadRequestException('User with this email already exists');
  }
  return this.repository.save({
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    roles: [UserRole.CLEANER],
  });
}
```

Add imports for `BadRequestException` and `UserRole`.

- [ ] **Step 3: Add cleaner management endpoints to CleaningController**

In `backend/src/cleaning/cleaning.controller.ts`, add:

```typescript
import { UserService } from '@asset-backend/people/user/user.service';
import { CreateCleanerDto } from './dtos/create-cleaner.dto';
```

Add `UserService` to constructor and add these endpoints:

```typescript
  @Post('cleaners')
  @Roles(UserRole.ADMIN)
  createCleaner(@Body() dto: CreateCleanerDto) {
    return this.userService.createCleaner(dto);
  }

  @Get('cleaners')
  @Roles(UserRole.ADMIN)
  getCleaners(@User() user: JWTUser) {
    return this.userService.findCleanersForAdmin(user.id);
  }
```

Note: `findCleanersForAdmin` needs to be added to UserService — it should find all users with CLEANER role who are assigned (via PropertyCleaner) to any property owned by the admin. This requires a query joining PropertyCleaner → Ownership.

- [ ] **Step 4: Add findCleanersForAdmin to UserService**

In `backend/src/people/user/user.service.ts`, add:

```typescript
async findCleanersForAdmin(adminUserId: number): Promise<User[]> {
  return this.repository
    .createQueryBuilder('user')
    .innerJoin('property_cleaner', 'pc', 'pc.userId = user.id')
    .innerJoin('ownership', 'o', 'o.propertyId = pc.propertyId AND o.userId = :adminUserId', {
      adminUserId,
    })
    .where("'cleaner' = ANY(user.roles)")
    .getMany();
}
```

- [ ] **Step 5: Update CleaningModule imports**

In `backend/src/cleaning/cleaning.module.ts`, add `PeopleModule` to imports so `UserService` is available:

```typescript
import { PeopleModule } from '@asset-backend/people/people.module';

// In imports array:
imports: [
  TypeOrmModule.forFeature([Cleaning, PropertyCleaner]),
  AuthModule,
  PeopleModule,
],
```

- [ ] **Step 6: Run all backend tests**

Run: `cd backend && npm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/cleaning/ backend/src/people/
git commit -m "feat: add cleaner user creation and listing endpoints"
```

---

### Task 6: Database Migration

Create a single migration for all schema changes.

**Files:**
- Create: `backend/src/migrations/<timestamp>-AddCleaningManagement.ts`

- [ ] **Step 1: Generate or manually create the migration**

Create `backend/src/migrations/1775400000000-AddCleaningManagement.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCleaningManagement1775400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add roles column to user table
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "roles" text[] NOT NULL DEFAULT '{owner}'`,
    );

    // 2. Migrate isAdmin data
    await queryRunner.query(
      `UPDATE "user" SET "roles" = '{admin,owner}' WHERE "isAdmin" = true`,
    );

    // 3. Drop isAdmin column
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "isAdmin"`,
    );

    // 4. Add cleaningBruttoPrice to property
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN "cleaningBruttoPrice" decimal(12,2)`,
    );

    // 5. Create property_cleaner table
    await queryRunner.query(`
      CREATE TABLE "property_cleaner" (
        "propertyId" integer NOT NULL,
        "userId" integer NOT NULL,
        CONSTRAINT "PK_property_cleaner" PRIMARY KEY ("propertyId", "userId"),
        CONSTRAINT "FK_property_cleaner_property" FOREIGN KEY ("propertyId")
          REFERENCES "property"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_property_cleaner_user" FOREIGN KEY ("userId")
          REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);

    // 6. Create cleaning table
    await queryRunner.query(`
      CREATE TABLE "cleaning" (
        "id" SERIAL PRIMARY KEY,
        "date" date NOT NULL,
        "propertyId" integer NOT NULL,
        "userId" integer NOT NULL,
        "percentage" integer NOT NULL,
        CONSTRAINT "FK_cleaning_property" FOREIGN KEY ("propertyId")
          REFERENCES "property"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cleaning_user" FOREIGN KEY ("userId")
          REFERENCES "user"("id")
      )
    `);

    // 7. Index for querying cleanings by property and date
    await queryRunner.query(
      `CREATE INDEX "IDX_cleaning_property_date" ON "cleaning" ("propertyId", "date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cleaning_property_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cleaning"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "property_cleaner"`);
    await queryRunner.query(`ALTER TABLE "property" DROP COLUMN IF EXISTS "cleaningBruttoPrice"`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "isAdmin" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(
      `UPDATE "user" SET "isAdmin" = true WHERE 'admin' = ANY("roles")`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "roles"`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/migrations/
git commit -m "feat: add database migration for cleaning management"
```

---

### Task 7: E2E Tests

Add end-to-end tests for the cleaning module.

**Files:**
- Create: `backend/test/cleaning.e2e-spec.ts`

- [ ] **Step 1: Write e2e tests**

Create `backend/test/cleaning.e2e-spec.ts`:

```typescript
import * as http from 'http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@asset-backend/app.module';
import {
  prepareDatabase,
  getTestUsers,
  getUserAccessToken2,
  getBearerToken,
  closeAppGracefully,
  TestUsersSetup,
} from './helper-functions';
import { AuthService } from '@asset-backend/auth/auth.service';
import { UserService } from '@asset-backend/people/user/user.service';
import { UserRole } from '@asset-backend/common/types';

describe('CleaningController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let userService: UserService;
  let testUsers: TestUsersSetup;
  let adminToken: string;
  let cleanerToken: string;
  let cleanerUserId: number;
  let testPropertyId: number;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    server = app.getHttpServer();

    authService = app.get(AuthService);
    userService = app.get(UserService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    adminToken = await getUserAccessToken2(authService, testUsers.user1WithProperties.jwtUser);

    // Get a property ID from the admin's properties
    testPropertyId = testUsers.user1WithProperties.jwtUser.ownershipInProperties[0];

    // Create a cleaner user
    const cleaner = await userService.createCleaner({
      email: 'cleaner-e2e@test.com',
      firstName: 'Test',
      lastName: 'Cleaner',
    });
    cleanerUserId = cleaner.id!;
    cleanerToken = await getUserAccessToken2(authService, {
      ...testUsers.user1WithProperties.jwtUser,
      id: cleanerUserId,
      roles: [UserRole.CLEANER],
      ownershipInProperties: [],
    });
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe('Cleaner assignment', () => {
    it('POST /api/cleaning/property/:id/cleaners - assigns cleaner', async () => {
      await request(server)
        .post(`/api/cleaning/property/${testPropertyId}/cleaners`)
        .set('Authorization', getBearerToken(adminToken))
        .send({ userId: cleanerUserId })
        .expect(201);
    });

    it('GET /api/cleaning/property/:id/cleaners - lists cleaners', async () => {
      const response = await request(server)
        .get(`/api/cleaning/property/${testPropertyId}/cleaners`)
        .set('Authorization', getBearerToken(adminToken))
        .expect(200);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ userId: cleanerUserId }),
        ]),
      );
    });
  });

  describe('Cleaning CRUD', () => {
    let cleaningId: number;

    it('POST /api/cleaning - cleaner adds cleaning', async () => {
      const response = await request(server)
        .post('/api/cleaning')
        .set('Authorization', getBearerToken(cleanerToken))
        .send({
          date: '2026-04-07',
          propertyId: testPropertyId,
          percentage: 100,
        })
        .expect(201);

      cleaningId = response.body.id;
      expect(cleaningId).toBeDefined();
      expect(response.body.percentage).toBe(100);
    });

    it('GET /api/cleaning/my - cleaner sees own cleanings', async () => {
      const response = await request(server)
        .get('/api/cleaning/my')
        .set('Authorization', getBearerToken(cleanerToken))
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/cleaning/property/:id?month=4&year=2026 - admin sees property cleanings', async () => {
      const response = await request(server)
        .get(`/api/cleaning/property/${testPropertyId}?month=4&year=2026`)
        .set('Authorization', getBearerToken(adminToken))
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('DELETE /api/cleaning/:id - cleaner deletes own cleaning', async () => {
      await request(server)
        .delete(`/api/cleaning/${cleaningId}`)
        .set('Authorization', getBearerToken(cleanerToken))
        .expect(200);
    });
  });

  describe('Authorization', () => {
    it('rejects cleaner from unassigned property', async () => {
      await request(server)
        .post('/api/cleaning')
        .set('Authorization', getBearerToken(cleanerToken))
        .send({
          date: '2026-04-07',
          propertyId: 99999,
          percentage: 100,
        })
        .expect(401);
    });
  });
});
```

- [ ] **Step 2: Run e2e tests**

Run: `cd backend && npm run test:e2e -- --testPathPattern=cleaning`
Expected: PASS (may need adjustments based on actual test helper setup)

- [ ] **Step 3: Commit**

```bash
git add backend/test/cleaning.e2e-spec.ts
git commit -m "test: add e2e tests for cleaning module"
```

---

### Task 8: Frontend Types and PropertyForm Update

Update frontend types and add cleaningBruttoPrice to the property form.

**Files:**
- Modify: `frontend/src/types/entities.ts`
- Modify: `frontend/src/types/inputs.ts`
- Modify: `frontend/src/types/common.ts` (or wherever enums are re-exported)
- Modify: `frontend/src/components/property/PropertyForm.tsx`

- [ ] **Step 1: Add UserRole enum and update frontend types**

In `frontend/src/types/entities.ts`, replace `isAdmin: boolean` with `roles: UserRole[]` in the User interface.

Add UserRole enum (or import from a shared types file if one exists):

```typescript
export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  CLEANER = 'cleaner',
}
```

Add to User interface:
```typescript
roles: UserRole[];
```
Remove: `isAdmin: boolean;`

Add to Property interface:
```typescript
cleaningBruttoPrice?: number;
```

Add new interfaces:

```typescript
export interface Cleaning {
  id: number;
  date: string;
  propertyId: number;
  userId: number;
  percentage: number;
  user?: User;
  property?: Property;
}

export interface PropertyCleaner {
  propertyId: number;
  userId: number;
  user?: User;
  property?: Property;
}
```

- [ ] **Step 2: Update frontend input types**

In `frontend/src/types/inputs.ts`, add to PropertyInput:

```typescript
cleaningBruttoPrice?: number;
```

Add new input type:

```typescript
export interface CleaningInput {
  date: string;
  propertyId: number;
  percentage: number;
}
```

- [ ] **Step 3: Update all frontend isAdmin references**

Search frontend for `isAdmin` and update to use `roles`:
- Replace `user.isAdmin` checks with `user.roles?.includes(UserRole.ADMIN)` or similar
- Update any admin-only UI conditionals

Run: `cd frontend && grep -rn "isAdmin" src/ --include="*.ts" --include="*.tsx"`

Fix each occurrence.

- [ ] **Step 4: Add cleaningBruttoPrice to PropertyForm**

In `frontend/src/components/property/PropertyForm.tsx`, in the Airbnb section (near the `isAirbnb` toggle around line 451), add the money field below the toggle, conditionally shown when `isAirbnb` is true:

```tsx
{data.isAirbnb && (
  <AssetMoneyField
    label={t('cleaningBruttoPrice')}
    value={data.cleaningBruttoPrice ?? ''}
    onChange={(value) => handleChange('cleaningBruttoPrice', value)}
  />
)}
```

Also update the initial form state to include `cleaningBruttoPrice: undefined`.

- [ ] **Step 5: Run frontend tests**

Run: `cd frontend && npm test -- --watchAll=false`
Expected: PASS (may need updates for isAdmin → roles in test mocks)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/ frontend/src/components/property/PropertyForm.tsx
git commit -m "feat: update frontend types for roles and cleaningBruttoPrice"
```

---

### Task 9: Translations

Add all cleaning-related translation keys to en, fi, and sv.

**Files:**
- Create: `frontend/src/translations/cleaning/en.ts`
- Create: `frontend/src/translations/cleaning/fi.ts`
- Create: `frontend/src/translations/cleaning/sv.ts`
- Modify: `frontend/src/translations/property/en.ts`
- Modify: `frontend/src/translations/property/fi.ts`
- Modify: `frontend/src/translations/property/sv.ts`
- Modify: i18n config to register new namespace

- [ ] **Step 1: Create cleaning namespace translations**

Create `frontend/src/translations/cleaning/en.ts`:

```typescript
const cleaning = {
  pageTitle: 'Cleaning',
  addCleaning: 'Add cleaning',
  date: 'Date',
  cleaner: 'Cleaner',
  percentage: 'Share %',
  amount: 'Amount',
  total: 'Total',
  property: 'Property',
  cleaningHistory: 'Cleaning history',
  myCleaningHistory: 'My cleaning history',
  monthlySummary: 'Summary by cleaner',
  cleanings: 'cleanings',
  cleaning: 'cleaning',
  save: 'Save',
  back: 'Back',
  bruttoPrice: 'Cleaning gross price',
  noCleanings: 'No cleanings for this month',
  manageCleaners: 'Manage cleaners',
  assignCleaner: 'Assign cleaner',
  removeCleaner: 'Remove cleaner',
  createCleaner: 'Create cleaner account',
  email: 'Email',
  firstName: 'First name',
  lastName: 'Last name',
  cleanerRole: 'Cleaner',
  noCleanersAssigned: 'No cleaners assigned',
};

export default cleaning;
```

Create `frontend/src/translations/cleaning/fi.ts`:

```typescript
const cleaning = {
  pageTitle: 'Siivous',
  addCleaning: 'Lisää siivous',
  date: 'Päivämäärä',
  cleaner: 'Siivooja',
  percentage: 'Osuus %',
  amount: 'Summa',
  total: 'Yhteensä',
  property: 'Kohde',
  cleaningHistory: 'Siivoushistoria',
  myCleaningHistory: 'Omat siivoushistoria',
  monthlySummary: 'Yhteenveto siivoojakohtaisesti',
  cleanings: 'siivousta',
  cleaning: 'siivous',
  save: 'Tallenna',
  back: 'Takaisin',
  bruttoPrice: 'Siivous bruttohinta',
  noCleanings: 'Ei siivouksia tälle kuukaudelle',
  manageCleaners: 'Hallinnoi siivoojia',
  assignCleaner: 'Lisää siivooja',
  removeCleaner: 'Poista siivooja',
  createCleaner: 'Luo siivoojan tili',
  email: 'Sähköposti',
  firstName: 'Etunimi',
  lastName: 'Sukunimi',
  cleanerRole: 'Siivooja',
  noCleanersAssigned: 'Ei siivoojia liitetty',
};

export default cleaning;
```

Create `frontend/src/translations/cleaning/sv.ts`:

```typescript
const cleaning = {
  pageTitle: 'Städning',
  addCleaning: 'Lägg till städning',
  date: 'Datum',
  cleaner: 'Städare',
  percentage: 'Andel %',
  amount: 'Belopp',
  total: 'Totalt',
  property: 'Fastighet',
  cleaningHistory: 'Städhistorik',
  myCleaningHistory: 'Min städhistorik',
  monthlySummary: 'Sammanfattning per städare',
  cleanings: 'städningar',
  cleaning: 'städning',
  save: 'Spara',
  back: 'Tillbaka',
  bruttoPrice: 'Städning bruttopris',
  noCleanings: 'Inga städningar för denna månad',
  manageCleaners: 'Hantera städare',
  assignCleaner: 'Tilldela städare',
  removeCleaner: 'Ta bort städare',
  createCleaner: 'Skapa städarkonto',
  email: 'E-post',
  firstName: 'Förnamn',
  lastName: 'Efternamn',
  cleanerRole: 'Städare',
  noCleanersAssigned: 'Inga städare tilldelade',
};

export default cleaning;
```

- [ ] **Step 2: Add cleaningBruttoPrice translation to property namespace**

In `frontend/src/translations/property/en.ts`, add:
```typescript
cleaningBruttoPrice: 'Cleaning gross price',
```

In `frontend/src/translations/property/fi.ts`, add:
```typescript
cleaningBruttoPrice: 'Siivous bruttohinta',
```

In `frontend/src/translations/property/sv.ts`, add:
```typescript
cleaningBruttoPrice: 'Städning bruttopris',
```

- [ ] **Step 3: Register cleaning namespace in i18n config**

Find the i18n configuration file (likely `frontend/src/i18n.ts` or similar) and register the new `cleaning` namespace by importing and adding the translation files.

- [ ] **Step 4: Run translation coverage test**

Run: `cd frontend && npm test -- --watchAll=false --testPathPattern=translation`
Expected: PASS — all keys exist in all three languages

- [ ] **Step 5: Commit**

```bash
git add frontend/src/translations/
git commit -m "feat: add cleaning translations (en, fi, sv)"
```

---

### Task 10: Admin Cleaning Page

The monthly cleaning view accessible from PropertyView for Airbnb properties.

**Files:**
- Create: `frontend/src/components/cleaning/AdminCleaningPage.tsx`
- Create: `frontend/src/components/cleaning/CleanerSummaryCards.tsx`
- Modify: `frontend/src/components/property/PropertyView.tsx`
- Modify: `frontend/src/components/AppRoutes.tsx`

- [ ] **Step 1: Add route for admin cleaning page**

In `frontend/src/components/AppRoutes.tsx`, add the cleaning route inside the protected routes:

```tsx
<Route path="portfolio/property/:idParam/cleanings" element={<AdminCleaningPage />} />
```

Import `AdminCleaningPage` (lazy or direct).

- [ ] **Step 2: Add "Siivous" button to PropertyView**

In `frontend/src/components/property/PropertyView.tsx`, add a button in the header area (after the PropertyActionsMenu, or in the actions section), conditionally shown:

```tsx
{property.isAirbnb && (
  <AssetButton
    label={t('cleaning:pageTitle')}
    variant="outlined"
    size="small"
    onClick={() => navigate(`/app/portfolio/property/${idParam}/cleanings`)}
  />
)}
```

Add `useTranslation` for `cleaning` namespace or use `withTranslation` with multiple namespaces.

- [ ] **Step 3: Create CleanerSummaryCards component**

Create `frontend/src/components/cleaning/CleanerSummaryCards.tsx`:

```tsx
import { Box, Typography } from '@mui/material';
import { TFunction } from 'i18next';
import { Cleaning, User } from '@asset-types';

interface CleanerSummary {
  user: User;
  count: number;
  totalAmount: number;
}

interface CleanerSummaryCardsProps {
  t: TFunction;
  cleanings: Cleaning[];
  bruttoPrice: number;
}

function calculateSummaries(cleanings: Cleaning[], bruttoPrice: number): CleanerSummary[] {
  const map = new Map<number, CleanerSummary>();
  for (const c of cleanings) {
    if (!c.user) continue;
    const existing = map.get(c.userId);
    const amount = (bruttoPrice * c.percentage) / 100;
    if (existing) {
      existing.count += 1;
      existing.totalAmount += amount;
    } else {
      map.set(c.userId, { user: c.user, count: 1, totalAmount: amount });
    }
  }
  return Array.from(map.values());
}

export default function CleanerSummaryCards({ t, cleanings, bruttoPrice }: CleanerSummaryCardsProps) {
  const summaries = calculateSummaries(cleanings, bruttoPrice);

  if (summaries.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {t('cleaning:monthlySummary')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {summaries.map((s) => (
          <Box
            key={s.user.id}
            sx={{
              flex: 1,
              minWidth: 150,
              p: 1.5,
              bgcolor: 'grey.100',
              borderRadius: 1.5,
            }}
          >
            <Typography variant="body2" fontWeight={500}>
              {s.user.firstName} {s.user.lastName?.charAt(0)}.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {s.count} {s.count === 1 ? t('cleaning:cleaning') : t('cleaning:cleanings')}
            </Typography>
            <Typography variant="h6" color="success.main" fontWeight={600} sx={{ mt: 0.5 }}>
              {t('format.currency.euro', { val: s.totalAmount })}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Create AdminCleaningPage component**

Create `frontend/src/components/cleaning/AdminCleaningPage.tsx`:

```tsx
import { Box, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AssetButton from '../asset/form/AssetButton';
import AssetDataTable from '../asset/datatable/AssetDataTable';
import CleanerSummaryCards from './CleanerSummaryCards';
import ApiClient from '@asset-lib/api-client';
import { Cleaning, Property } from '@asset-types';

interface CleaningRow extends Cleaning {
  cleanerName: string;
  amount: number;
}

export default function AdminCleaningPage() {
  const { idParam } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['cleaning', 'property']);

  const [property, setProperty] = useState<Property | null>(null);
  const [cleanings, setCleaning] = useState<Cleaning[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const propertyId = Number(idParam);

  useEffect(() => {
    ApiClient.get<Property>('real-estate/property', propertyId).then(setProperty);
  }, [propertyId]);

  const fetchCleanings = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getAll<Cleaning>(
        `cleaning/property/${propertyId}?month=${month}&year=${year}`,
      );
      setCleaning(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleanings();
  }, [propertyId, month, year, refreshTrigger]);

  const rows: CleaningRow[] = useMemo(
    () =>
      cleanings.map((c) => ({
        ...c,
        cleanerName: c.user ? `${c.user.firstName} ${c.user.lastName?.charAt(0)}.` : '',
        amount: ((property?.cleaningBruttoPrice ?? 0) * c.percentage) / 100,
      })),
    [cleanings, property],
  );

  const rowDataService = useMemo(
    () => ({
      search: async () => rows,
      delete: async (id: number) => {
        await ApiClient.delete('cleaning', id);
        setRefreshTrigger((prev) => prev + 1);
      },
    }),
    [rows],
  );

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' });

  return (
    <Paper sx={{ p: 2 }}>
      <AssetButton
        label={t('cleaning:back')}
        variant="text"
        size="small"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/app/portfolio/property/${idParam}`)}
        sx={{ mb: 1 }}
      />

      <Typography variant="h6" fontWeight={600}>
        {t('cleaning:pageTitle')} — {property?.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('cleaning:bruttoPrice')}: {t('format.currency.euro', { val: property?.cleaningBruttoPrice ?? 0 })}
      </Typography>

      {/* Month navigator */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <AssetButton label="" variant="outlined" size="small" startIcon={<ChevronLeftIcon />} onClick={handlePrevMonth} />
        <Typography fontWeight={600} sx={{ textTransform: 'capitalize', minWidth: 160, textAlign: 'center' }}>
          {monthName}
        </Typography>
        <AssetButton label="" variant="outlined" size="small" startIcon={<ChevronRightIcon />} onClick={handleNextMonth} />
      </Stack>

      {/* Cleanings table */}
      <AssetDataTable<CleaningRow>
        t={t}
        dataService={rowDataService}
        fields={[
          { name: 'date', format: 'date' },
          { name: 'cleanerName', label: t('cleaning:cleaner') },
          { name: 'percentage', label: t('cleaning:percentage') },
          { name: 'amount', format: 'currency', sum: true, label: t('cleaning:amount') },
        ]}
        refreshTrigger={refreshTrigger}
      />

      {/* Per-cleaner summary */}
      <Box sx={{ mt: 2 }}>
        <CleanerSummaryCards
          t={t}
          cleanings={cleanings}
          bruttoPrice={property?.cleaningBruttoPrice ?? 0}
        />
      </Box>
    </Paper>
  );
}
```

- [ ] **Step 5: Run frontend tests**

Run: `cd frontend && npm test -- --watchAll=false`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/cleaning/ frontend/src/components/property/PropertyView.tsx frontend/src/components/AppRoutes.tsx
git commit -m "feat: add admin cleaning page with monthly view and cleaner summaries"
```

---

### Task 11: Cleaner Dashboard

The view cleaners see after login — property selector, add form, and history.

**Files:**
- Create: `frontend/src/components/cleaning/CleanerDashboard.tsx`
- Modify: `frontend/src/components/AppRoutes.tsx`
- Modify: `frontend/src/components/login/Login.tsx`

- [ ] **Step 1: Add cleaner route**

In `frontend/src/components/AppRoutes.tsx`, add inside protected routes:

```tsx
<Route path="cleaner" element={<CleanerDashboard />} />
```

- [ ] **Step 2: Update login redirect for cleaner-only users**

In `frontend/src/components/login/Login.tsx`, after fetching the user with `ApiClient.me()`, add a role check before the default redirect:

```typescript
const userRoles = user.roles ?? [];
const isCleanerOnly = userRoles.length === 1 && userRoles[0] === 'cleaner';
const defaultPath = isCleanerOnly ? '/app/cleaner' : '/app/dashboard';
```

Replace `navigate('/app/dashboard')` with `navigate(defaultPath)` in the default redirect case.

- [ ] **Step 3: Create CleanerDashboard component**

Create `frontend/src/components/cleaning/CleanerDashboard.tsx`:

```tsx
import { Box, Paper, Typography } from '@mui/material';
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AssetButton from '../asset/form/AssetButton';
import AssetDatePicker from '../asset/form/AssetDatePicker';
import AssetNumberField from '../asset/form/AssetNumberField';
import AssetSelectField from '../asset/form/AssetSelectField';
import AssetDataTable from '../asset/datatable/AssetDataTable';
import ApiClient from '@asset-lib/api-client';
import { Cleaning, Property, PropertyCleaner } from '@asset-types';

interface CleaningRow extends Cleaning {
  propertyName: string;
  amount: number;
}

export default function CleanerDashboard() {
  const { t } = useTranslation(['cleaning']);

  const [properties, setProperties] = useState<(PropertyCleaner & { property: Property })[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [cleanings, setCleanings] = useState<Cleaning[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [percentage, setPercentage] = useState<number>(100);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch assigned properties
  useEffect(() => {
    const fetchProperties = async () => {
      const data = await ApiClient.getAll<PropertyCleaner & { property: Property }>('cleaning/my/properties');
      setProperties(data);
      if (data.length > 0) {
        setSelectedPropertyId(data[0].propertyId);
      }
    };
    fetchProperties();
  }, []);

  // Fetch own cleanings
  useEffect(() => {
    const fetchCleanings = async () => {
      const data = await ApiClient.getAll<Cleaning>('cleaning/my');
      setCleanings(data);
    };
    fetchCleanings();
  }, [refreshTrigger]);

  const selectedProperty = properties.find((p) => p.propertyId === selectedPropertyId)?.property;
  const bruttoPrice = selectedProperty?.cleaningBruttoPrice ?? 0;
  const calculatedAmount = (bruttoPrice * percentage) / 100;
  const hasMultipleProperties = properties.length > 1;

  const handleSave = async () => {
    if (!selectedPropertyId) return;
    await ApiClient.post('cleaning', {
      date: date.toISOString().split('T')[0],
      propertyId: selectedPropertyId,
      percentage,
    });
    setRefreshTrigger((prev) => prev + 1);
    setPercentage(100);
  };

  const rows: CleaningRow[] = useMemo(
    () =>
      cleanings.map((c) => {
        const prop = properties.find((p) => p.propertyId === c.propertyId)?.property;
        return {
          ...c,
          propertyName: prop?.name ?? '',
          amount: ((prop?.cleaningBruttoPrice ?? 0) * c.percentage) / 100,
        };
      }),
    [cleanings, properties],
  );

  const rowDataService = useMemo(
    () => ({
      search: async () => rows,
      delete: async (id: number) => {
        await ApiClient.delete('cleaning', id);
        setRefreshTrigger((prev) => prev + 1);
      },
    }),
    [rows],
  );

  return (
    <Paper sx={{ p: 2 }}>
      {/* Property selector */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="overline" color="text.secondary">
          {t('cleaning:property')}
        </Typography>
        {hasMultipleProperties ? (
          <AssetSelectField
            label={t('cleaning:property')}
            value={selectedPropertyId ?? ''}
            onChange={(value) => setSelectedPropertyId(Number(value))}
            options={properties.map((p) => ({
              value: p.propertyId,
              label: p.property.name,
            }))}
          />
        ) : (
          <Typography variant="h6" fontWeight={600}>
            {selectedProperty?.name ?? ''}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {t('cleaning:bruttoPrice')}: {t('format.currency.euro', { val: bruttoPrice })}
        </Typography>
      </Box>

      {/* Add cleaning form */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
          {t('cleaning:addCleaning')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 140 }}>
            <AssetDatePicker
              label={t('cleaning:date')}
              value={date}
              onChange={(value) => value && setDate(value)}
            />
          </Box>
          <Box sx={{ width: 100 }}>
            <AssetNumberField
              label={t('cleaning:percentage')}
              value={percentage}
              onChange={(value) => setPercentage(value ?? 100)}
            />
          </Box>
          <Box sx={{ width: 100 }}>
            <Typography variant="caption" color="text.secondary">
              {t('cleaning:amount')}
            </Typography>
            <Typography variant="h6" color="success.main" fontWeight={600}>
              {t('format.currency.euro', { val: calculatedAmount })}
            </Typography>
          </Box>
          <AssetButton label={t('cleaning:save')} onClick={handleSave} />
        </Box>
      </Paper>

      {/* Cleaning history */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        {t('cleaning:myCleaningHistory')}
      </Typography>
      <AssetDataTable<CleaningRow>
        t={t}
        dataService={rowDataService}
        fields={[
          { name: 'date', format: 'date' },
          { name: 'propertyName', label: t('cleaning:property') },
          { name: 'percentage', label: t('cleaning:percentage') },
          { name: 'amount', format: 'currency', sum: true, label: t('cleaning:amount') },
        ]}
        refreshTrigger={refreshTrigger}
      />
    </Paper>
  );
}
```

- [ ] **Step 4: Add endpoint for cleaner's assigned properties**

Note: The cleaner dashboard calls `GET /api/cleaning/my/properties`. This needs to be added to the `CleaningController`:

```typescript
@Get('my/properties')
@Roles(UserRole.CLEANER)
getMyProperties(@User() user: JWTUser) {
  return this.propertyCleanerService.getPropertiesForCleaner(user.id);
}
```

Add this to `backend/src/cleaning/cleaning.controller.ts`.

- [ ] **Step 5: Run frontend tests**

Run: `cd frontend && npm test -- --watchAll=false`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/cleaning/CleanerDashboard.tsx frontend/src/components/AppRoutes.tsx frontend/src/components/login/Login.tsx backend/src/cleaning/cleaning.controller.ts
git commit -m "feat: add cleaner dashboard with property selector and cleaning form"
```

---

### Task 12: Cleaner Management Dialog in PropertyView

Allow admins to manage cleaners for a property from the property actions menu.

**Files:**
- Create: `frontend/src/components/cleaning/ManageCleanersDialog.tsx`
- Modify: `frontend/src/components/property/sections/PropertyActionsMenu.tsx`
- Modify: `frontend/src/components/property/PropertyView.tsx`

- [ ] **Step 1: Create ManageCleanersDialog**

Create `frontend/src/components/cleaning/ManageCleanersDialog.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import AssetDialog from '../asset/AssetDialog';
import AssetTextField from '../asset/form/AssetTextField';
import AssetButton from '../asset/form/AssetButton';
import ApiClient from '@asset-lib/api-client';
import { PropertyCleaner, User } from '@asset-types';

interface ManageCleanersDialogProps {
  open: boolean;
  propertyId: number;
  onClose: () => void;
}

export default function ManageCleanersDialog({ open, propertyId, onClose }: ManageCleanersDialogProps) {
  const { t } = useTranslation(['cleaning']);
  const [cleaners, setCleaners] = useState<(PropertyCleaner & { user: User })[]>([]);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchCleaners = async () => {
    const data = await ApiClient.getAll<PropertyCleaner & { user: User }>(
      `cleaning/property/${propertyId}/cleaners`,
    );
    setCleaners(data);
  };

  useEffect(() => {
    if (open) fetchCleaners();
  }, [open, propertyId]);

  const handleCreateAndAssign = async () => {
    const user = await ApiClient.post<User>('cleaning/cleaners', { email, firstName, lastName });
    await ApiClient.post(`cleaning/property/${propertyId}/cleaners`, { userId: user.id });
    setEmail('');
    setFirstName('');
    setLastName('');
    setShowCreateForm(false);
    fetchCleaners();
  };

  const handleRemove = async (userId: number) => {
    await ApiClient.delete(`cleaning/property/${propertyId}/cleaners/${userId}`, userId);
    fetchCleaners();
  };

  return (
    <AssetDialog open={open} onClose={onClose} title={t('cleaning:manageCleaners')}>
      <Box sx={{ minWidth: 300 }}>
        {cleaners.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t('cleaning:noCleanersAssigned')}
          </Typography>
        ) : (
          <List>
            {cleaners.map((c) => (
              <ListItem
                key={c.userId}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleRemove(c.userId)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={`${c.user.firstName} ${c.user.lastName}`}
                  secondary={c.user.email}
                />
              </ListItem>
            ))}
          </List>
        )}

        {showCreateForm ? (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {t('cleaning:createCleaner')}
            </Typography>
            <AssetTextField
              label={t('cleaning:email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AssetTextField
              label={t('cleaning:firstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <AssetTextField
              label={t('cleaning:lastName')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <AssetButton label={t('cleaning:save')} onClick={handleCreateAndAssign} />
          </Box>
        ) : (
          <AssetButton
            label={t('cleaning:assignCleaner')}
            variant="outlined"
            onClick={() => setShowCreateForm(true)}
            sx={{ mt: 1 }}
          />
        )}
      </Box>
    </AssetDialog>
  );
}
```

- [ ] **Step 2: Add "Manage Cleaners" to PropertyActionsMenu**

In `frontend/src/components/property/sections/PropertyActionsMenu.tsx`:

Add a new prop `onOpenManageCleaners?: () => void` to the props interface.

Add a conditional menu item:

```tsx
{property.isAirbnb && onOpenManageCleaners && (
  <MenuItem onClick={() => { handleCloseMenu(); onOpenManageCleaners(); }}>
    <ListItemIcon><CleaningServicesIcon fontSize="small" /></ListItemIcon>
    {t('cleaning:manageCleaners')}
  </MenuItem>
)}
```

Import `CleaningServicesIcon` from `@mui/icons-material/CleaningServices`.

- [ ] **Step 3: Wire up in PropertyView**

In `frontend/src/components/property/PropertyView.tsx`:

Add state: `const [cleanersDialogOpen, setCleanersDialogOpen] = useState(false);`

Pass to PropertyActionsMenu: `onOpenManageCleaners={() => setCleanersDialogOpen(true)}`

Add dialog at the bottom:
```tsx
<ManageCleanersDialog
  open={cleanersDialogOpen}
  propertyId={property.id}
  onClose={() => setCleanersDialogOpen(false)}
/>
```

- [ ] **Step 4: Run frontend tests**

Run: `cd frontend && npm test -- --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/cleaning/ManageCleanersDialog.tsx frontend/src/components/property/
git commit -m "feat: add manage cleaners dialog to property actions menu"
```

---

### Task 13: Final Integration Testing and Cleanup

Verify everything works end-to-end and fix any remaining issues.

**Files:**
- Various files as needed for fixes

- [ ] **Step 1: Run all backend tests**

Run: `cd backend && npm test && npm run test:e2e`
Expected: All PASS

- [ ] **Step 2: Run all frontend tests**

Run: `cd frontend && npm test -- --watchAll=false`
Expected: All PASS

- [ ] **Step 3: Build frontend**

Run: `cd frontend && npm run build`
Expected: No TypeScript errors, build succeeds

- [ ] **Step 4: Run backend lint**

Run: `cd backend && npm run lint`
Expected: No errors

- [ ] **Step 5: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: No errors

- [ ] **Step 6: Fix any issues found in steps 1-5**

Address any type errors, lint errors, or test failures.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: fix integration issues for cleaning management feature"
```
