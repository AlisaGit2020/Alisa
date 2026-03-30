# Tax Deductions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tax-only deductions for Airbnb properties (travel, laundry) and custom deductions for any property.

**Architecture:** New `TaxDeduction` entity stored separately from `Expense`, integrated into `TaxService.calculate()`. Property entity extended with `isAirbnb` and `distanceFromHome` fields. Frontend dialogs for each deduction type in the Tax View.

**Tech Stack:** NestJS + TypeORM (backend), React + Material-UI (frontend), PostgreSQL

---

## File Structure

### Backend - New Files
| File | Responsibility |
|------|----------------|
| `backend/src/real-estate/property/entities/tax-deduction.entity.ts` | TaxDeduction database entity |
| `backend/src/real-estate/property/tax-deduction.service.ts` | CRUD operations, calculation helpers |
| `backend/src/real-estate/property/tax-deduction.controller.ts` | REST endpoints |
| `backend/src/real-estate/property/dtos/tax-deduction-input.dto.ts` | Input validation |
| `backend/src/real-estate/property/dtos/tax-deduction-response.dto.ts` | Response DTOs |
| `backend/src/real-estate/property/travel-compensation-rates.ts` | Finnish rate constants |
| `backend/src/migrations/TIMESTAMP-CreateTaxDeductionTable.ts` | Database migration |
| `backend/src/real-estate/property/tax-deduction.service.spec.ts` | Unit tests |
| `backend/test/tax-deduction.e2e-spec.ts` | E2E tests |

### Backend - Modified Files
| File | Changes |
|------|---------|
| `backend/src/common/types.ts` | Add `TaxDeductionType` enum |
| `backend/src/real-estate/property/entities/property.entity.ts` | Add `isAirbnb`, `distanceFromHome` |
| `backend/src/real-estate/property/dtos/property-input.dto.ts` | Add new field validators |
| `backend/src/real-estate/property/tax.service.ts` | Include tax deductions in calculation |
| `backend/src/real-estate/property/dtos/tax-response.dto.ts` | Add `taxDeductions`, `taxDeductionBreakdown` |
| `backend/src/real-estate/real-estate.module.ts` | Register new service/controller |

### Frontend - New Files
| File | Responsibility |
|------|----------------|
| `frontend/src/components/tax/TaxDeductionDialog.tsx` | Dialog container with form switching |
| `frontend/src/components/tax/TravelDeductionForm.tsx` | Travel expense calculator |
| `frontend/src/components/tax/LaundryDeductionForm.tsx` | Laundry expense calculator |
| `frontend/src/components/tax/CustomDeductionForm.tsx` | Manual entry form |

### Frontend - Modified Files
| File | Changes |
|------|---------|
| `frontend/src/types/common.ts` | Add `TaxDeductionType` enum |
| `frontend/src/types/entities.ts` | Add `TaxDeduction` interface |
| `frontend/src/types/inputs.ts` | Add `TaxDeductionInput` interface |
| `frontend/src/components/property/PropertyForm.tsx` | Add Airbnb settings section |
| `frontend/src/components/tax/TaxView.tsx` | Add dropdown button, dialogs |
| `frontend/src/components/tax/TaxBreakdown.tsx` | Display tax deductions section |
| `frontend/src/translations/tax/*.ts` | New translation keys |
| `frontend/src/translations/property/*.ts` | Airbnb field translations |

---

## Task 1: Add TaxDeductionType Enum to Backend

**Files:**
- Modify: `backend/src/common/types.ts`

- [ ] **Step 1: Add TaxDeductionType enum after IncomeTypeKey**

Add at the end of `backend/src/common/types.ts`:

```typescript
// Tax deduction types (tax-only, no accounting impact)
export enum TaxDeductionType {
  TRAVEL = 1,
  LAUNDRY = 2,
  CUSTOM = 3,
}

export const taxDeductionTypeNames = new Map<TaxDeductionType, string>([
  [TaxDeductionType.TRAVEL, 'travel'],
  [TaxDeductionType.LAUNDRY, 'laundry'],
  [TaxDeductionType.CUSTOM, 'custom'],
]);

export interface TaxDeductionMetadata {
  distanceKm?: number;
  visits?: number;
  ratePerKm?: number;
  pricePerLaundry?: number;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd backend && npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add backend/src/common/types.ts
git commit -m "feat(tax): add TaxDeductionType enum and metadata interface"
```

---

## Task 2: Add Airbnb Fields to Property Entity

**Files:**
- Modify: `backend/src/real-estate/property/entities/property.entity.ts`
- Modify: `backend/src/real-estate/property/dtos/property-input.dto.ts`

- [ ] **Step 1: Add isAirbnb and distanceFromHome columns to Property entity**

Add after the `waterCharge` field in `backend/src/real-estate/property/entities/property.entity.ts`:

```typescript
  @Column({ type: 'boolean', default: false })
  public isAirbnb: boolean = false;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 1,
    nullable: true,
    transformer: new DecimalToNumberTransformer(),
  })
  public distanceFromHome?: number;
```

- [ ] **Step 2: Add validators to PropertyInputDto**

Add at the end of `backend/src/real-estate/property/dtos/property-input.dto.ts`:

```typescript
  @IsOptional()
  @IsBoolean()
  isAirbnb?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999.9)
  distanceFromHome?: number;
```

Also add import at top:
```typescript
import { IsBoolean } from 'class-validator';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd backend && npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add backend/src/real-estate/property/entities/property.entity.ts backend/src/real-estate/property/dtos/property-input.dto.ts
git commit -m "feat(property): add isAirbnb and distanceFromHome fields"
```

---

## Task 3: Create Database Migration

**Files:**
- Create: `backend/src/migrations/1774855400000-CreateTaxDeductionTable.ts`

- [ ] **Step 1: Create migration file**

Create `backend/src/migrations/1774855400000-CreateTaxDeductionTable.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaxDeductionTable1774855400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns to property table
    await queryRunner.query(`
      ALTER TABLE property
      ADD COLUMN IF NOT EXISTS "isAirbnb" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "distanceFromHome" DECIMAL(6,1) NULL
    `);

    // Create tax_deduction table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tax_deduction (
        id SERIAL PRIMARY KEY,
        "propertyId" INTEGER NOT NULL REFERENCES property(id) ON DELETE CASCADE,
        year SMALLINT NOT NULL,
        "deductionType" SMALLINT NOT NULL,
        description VARCHAR(255),
        amount DECIMAL(12,2) NOT NULL,
        metadata JSONB
      )
    `);

    // Index for efficient lookup
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tax_deduction_property_year
      ON tax_deduction("propertyId", year)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS tax_deduction`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tax_deduction_property_year`);
    await queryRunner.query(`
      ALTER TABLE property
      DROP COLUMN IF EXISTS "isAirbnb",
      DROP COLUMN IF EXISTS "distanceFromHome"
    `);
  }
}
```

- [ ] **Step 2: Run migration locally**

Run: `cd backend && npm run migration:run`
Expected: Migration runs successfully

- [ ] **Step 3: Commit**

```bash
git add backend/src/migrations/1774855400000-CreateTaxDeductionTable.ts
git commit -m "feat(tax): add migration for tax_deduction table and property fields"
```

---

## Task 4: Create TaxDeduction Entity

**Files:**
- Create: `backend/src/real-estate/property/entities/tax-deduction.entity.ts`

- [ ] **Step 1: Create TaxDeduction entity**

Create `backend/src/real-estate/property/entities/tax-deduction.entity.ts`:

```typescript
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from './property.entity';
import { TaxDeductionMetadata, TaxDeductionType } from '@asset-backend/common/types';
import { DecimalToNumberTransformer } from '@asset-backend/common/transformer/entity.data.transformer';

@Entity('tax_deduction')
export class TaxDeduction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  propertyId: number;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ type: 'smallint' })
  year: number;

  @Column({ type: 'smallint' })
  deductionType: TaxDeductionType;

  @Column({ length: 255, nullable: true })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new DecimalToNumberTransformer(),
  })
  amount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: TaxDeductionMetadata | null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd backend && npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add backend/src/real-estate/property/entities/tax-deduction.entity.ts
git commit -m "feat(tax): create TaxDeduction entity"
```

---

## Task 5: Create Travel Compensation Rates Config

**Files:**
- Create: `backend/src/real-estate/property/travel-compensation-rates.ts`

- [ ] **Step 1: Create rates configuration**

Create `backend/src/real-estate/property/travel-compensation-rates.ts`:

```typescript
/**
 * Finnish tax authority travel compensation rates (EUR per km)
 * Source: https://www.vero.fi/
 */
export const TRAVEL_COMPENSATION_RATES: Record<number, number> = {
  2024: 0.30,
  2025: 0.30,
  2026: 0.30,
};

export const DEFAULT_LAUNDRY_PRICE = 3.0;

export function getTravelCompensationRate(year: number): number {
  return TRAVEL_COMPENSATION_RATES[year] ?? TRAVEL_COMPENSATION_RATES[2024] ?? 0.30;
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/real-estate/property/travel-compensation-rates.ts
git commit -m "feat(tax): add Finnish travel compensation rates config"
```

---

## Task 6: Create TaxDeduction DTOs

**Files:**
- Create: `backend/src/real-estate/property/dtos/tax-deduction-input.dto.ts`
- Create: `backend/src/real-estate/property/dtos/tax-deduction-response.dto.ts`

- [ ] **Step 1: Create input DTO**

Create `backend/src/real-estate/property/dtos/tax-deduction-input.dto.ts`:

```typescript
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { TaxDeductionMetadata, TaxDeductionType } from '@asset-backend/common/types';

export class TaxDeductionInputDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNotEmpty()
  @IsNumber()
  propertyId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(2020)
  @Max(2100)
  year: number;

  @IsEnum(TaxDeductionType)
  deductionType: TaxDeductionType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  metadata?: TaxDeductionMetadata;
}
```

- [ ] **Step 2: Create response DTOs**

Create `backend/src/real-estate/property/dtos/tax-deduction-response.dto.ts`:

```typescript
import { TaxDeductionMetadata, TaxDeductionType, taxDeductionTypeNames } from '@asset-backend/common/types';

export class TaxDeductionDto {
  id: number;
  propertyId: number;
  year: number;
  deductionType: TaxDeductionType;
  typeName: string;
  description: string | null;
  amount: number;
  metadata: TaxDeductionMetadata | null;

  static fromEntity(entity: {
    id: number;
    propertyId: number;
    year: number;
    deductionType: TaxDeductionType;
    description: string | null;
    amount: number;
    metadata: TaxDeductionMetadata | null;
  }): TaxDeductionDto {
    const dto = new TaxDeductionDto();
    dto.id = entity.id;
    dto.propertyId = entity.propertyId;
    dto.year = entity.year;
    dto.deductionType = entity.deductionType;
    dto.typeName = taxDeductionTypeNames.get(entity.deductionType) ?? 'custom';
    dto.description = entity.description;
    dto.amount = entity.amount;
    dto.metadata = entity.metadata;
    return dto;
  }
}

export class TaxDeductionCalculationDto {
  propertyId: number;
  propertyName: string;
  year: number;
  visits: number;
  distanceKm: number | null;
  ratePerKm: number;
  defaultLaundryPrice: number;
  travelAmount: number;
  laundryAmount: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/real-estate/property/dtos/tax-deduction-input.dto.ts backend/src/real-estate/property/dtos/tax-deduction-response.dto.ts
git commit -m "feat(tax): create TaxDeduction DTOs"
```

---

## Task 7: Create TaxDeductionService - Unit Tests First

**Files:**
- Create: `backend/src/real-estate/property/tax-deduction.service.spec.ts`

- [ ] **Step 1: Write failing unit tests**

Create `backend/src/real-estate/property/tax-deduction.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaxDeductionService } from './tax-deduction.service';
import { TaxDeduction } from './entities/tax-deduction.entity';
import { PropertyService } from './property.service';
import { PropertyStatisticsService } from './property-statistics.service';
import { TaxDeductionType } from '@asset-backend/common/types';

describe('TaxDeductionService', () => {
  let service: TaxDeductionService;
  let mockRepository: any;
  let mockPropertyService: any;
  let mockStatisticsService: any;

  const mockUser = { id: 1, email: 'test@test.com' };
  const mockProperty = { id: 1, name: 'Test Property', distanceFromHome: 25.0, isAirbnb: true };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockPropertyService = {
      findOne: jest.fn().mockResolvedValue(mockProperty),
    };

    mockStatisticsService = {
      getAirbnbVisits: jest.fn().mockResolvedValue(24),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxDeductionService,
        { provide: getRepositoryToken(TaxDeduction), useValue: mockRepository },
        { provide: PropertyService, useValue: mockPropertyService },
        { provide: PropertyStatisticsService, useValue: mockStatisticsService },
      ],
    }).compile();

    service = module.get<TaxDeductionService>(TaxDeductionService);
  });

  describe('calculateTravelDeduction', () => {
    it('should calculate travel amount correctly', () => {
      const result = service.calculateTravelDeduction(25.0, 24, 2025);
      // Round trip: 25 * 2 = 50km, 50 * 24 visits * 0.30 rate = 360
      expect(result.amount).toBe(360);
      expect(result.ratePerKm).toBe(0.30);
    });
  });

  describe('calculateLaundryDeduction', () => {
    it('should use default price when not specified', () => {
      const result = service.calculateLaundryDeduction(24);
      // 24 visits * 3.00 = 72
      expect(result.amount).toBe(72);
      expect(result.pricePerLaundry).toBe(3.0);
    });

    it('should use custom price when specified', () => {
      const result = service.calculateLaundryDeduction(24, 5.0);
      // 24 visits * 5.00 = 120
      expect(result.amount).toBe(120);
      expect(result.pricePerLaundry).toBe(5.0);
    });
  });

  describe('create', () => {
    it('should create a travel deduction', async () => {
      const input = {
        propertyId: 1,
        year: 2025,
        deductionType: TaxDeductionType.TRAVEL,
        amount: 360,
        metadata: { distanceKm: 25, visits: 24, ratePerKm: 0.30 },
      };

      mockRepository.save.mockResolvedValue({ id: 1, ...input });

      const result = await service.create(mockUser as any, input);
      expect(result.id).toBe(1);
      expect(mockPropertyService.findOne).toHaveBeenCalledWith(mockUser, 1);
    });

    it('should throw if property not owned by user', async () => {
      mockPropertyService.findOne.mockResolvedValue(null);

      await expect(service.create(mockUser as any, {
        propertyId: 999,
        year: 2025,
        deductionType: TaxDeductionType.CUSTOM,
        amount: 100,
      })).rejects.toThrow();
    });
  });

  describe('findByPropertyAndYear', () => {
    it('should return deductions for property and year', async () => {
      const mockDeductions = [
        { id: 1, propertyId: 1, year: 2025, deductionType: TaxDeductionType.TRAVEL, amount: 360 },
      ];
      mockRepository.find.mockResolvedValue(mockDeductions);

      const result = await service.findByPropertyAndYear(mockUser as any, 1, 2025);
      expect(result).toHaveLength(1);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npm run test -- --testPathPattern=tax-deduction.service.spec.ts`
Expected: FAIL (TaxDeductionService not found)

- [ ] **Step 3: Commit failing tests**

```bash
git add backend/src/real-estate/property/tax-deduction.service.spec.ts
git commit -m "test(tax): add failing unit tests for TaxDeductionService"
```

---

## Task 8: Implement TaxDeductionService

**Files:**
- Create: `backend/src/real-estate/property/tax-deduction.service.ts`

- [ ] **Step 1: Create TaxDeductionService**

Create `backend/src/real-estate/property/tax-deduction.service.ts`:

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxDeduction } from './entities/tax-deduction.entity';
import { PropertyService } from './property.service';
import { PropertyStatisticsService } from './property-statistics.service';
import { JWTUser } from '@asset-backend/auth/types';
import { TaxDeductionInputDto } from './dtos/tax-deduction-input.dto';
import { TaxDeductionDto, TaxDeductionCalculationDto } from './dtos/tax-deduction-response.dto';
import { StatisticKey } from '@asset-backend/common/types';
import {
  getTravelCompensationRate,
  DEFAULT_LAUNDRY_PRICE,
} from './travel-compensation-rates';

@Injectable()
export class TaxDeductionService {
  constructor(
    @InjectRepository(TaxDeduction)
    private repository: Repository<TaxDeduction>,
    private propertyService: PropertyService,
    private statisticsService: PropertyStatisticsService,
  ) {}

  async findByPropertyAndYear(
    user: JWTUser,
    propertyId: number,
    year: number,
  ): Promise<TaxDeductionDto[]> {
    // Verify user owns property
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const deductions = await this.repository.find({
      where: { propertyId, year },
      order: { id: 'ASC' },
    });

    return deductions.map(TaxDeductionDto.fromEntity);
  }

  async findAllForYear(
    user: JWTUser,
    year: number,
    propertyId?: number,
  ): Promise<TaxDeductionDto[]> {
    if (propertyId) {
      return this.findByPropertyAndYear(user, propertyId, year);
    }

    // Get all user's properties
    const properties = await this.propertyService.search(user, { select: ['id'] });
    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return [];
    }

    const deductions = await this.repository
      .createQueryBuilder('td')
      .where('td.propertyId IN (:...propertyIds)', { propertyIds })
      .andWhere('td.year = :year', { year })
      .orderBy('td.id', 'ASC')
      .getMany();

    return deductions.map(TaxDeductionDto.fromEntity);
  }

  async getCalculationPreview(
    user: JWTUser,
    propertyId: number,
    year: number,
  ): Promise<TaxDeductionCalculationDto> {
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const visits = await this.getAirbnbVisits(propertyId, year);
    const ratePerKm = getTravelCompensationRate(year);
    const distanceKm = property.distanceFromHome ?? null;

    const travelAmount = distanceKm
      ? this.calculateTravelDeduction(distanceKm, visits, year).amount
      : 0;
    const laundryAmount = this.calculateLaundryDeduction(visits).amount;

    return {
      propertyId,
      propertyName: property.name,
      year,
      visits,
      distanceKm,
      ratePerKm,
      defaultLaundryPrice: DEFAULT_LAUNDRY_PRICE,
      travelAmount,
      laundryAmount,
    };
  }

  async create(user: JWTUser, input: TaxDeductionInputDto): Promise<TaxDeductionDto> {
    // Verify user owns property
    const property = await this.propertyService.findOne(user, input.propertyId);
    if (!property) {
      throw new ForbiddenException('Property not found or not owned by user');
    }

    const entity = this.repository.create({
      propertyId: input.propertyId,
      year: input.year,
      deductionType: input.deductionType,
      description: input.description ?? null,
      amount: input.amount,
      metadata: input.metadata ?? null,
    });

    const saved = await this.repository.save(entity);
    return TaxDeductionDto.fromEntity(saved);
  }

  async update(
    user: JWTUser,
    id: number,
    input: TaxDeductionInputDto,
  ): Promise<TaxDeductionDto> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Tax deduction not found');
    }

    // Verify user owns property
    const property = await this.propertyService.findOne(user, existing.propertyId);
    if (!property) {
      throw new ForbiddenException('Property not found or not owned by user');
    }

    existing.description = input.description ?? null;
    existing.amount = input.amount;
    existing.metadata = input.metadata ?? null;

    const saved = await this.repository.save(existing);
    return TaxDeductionDto.fromEntity(saved);
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Tax deduction not found');
    }

    // Verify user owns property
    const property = await this.propertyService.findOne(user, existing.propertyId);
    if (!property) {
      throw new ForbiddenException('Property not found or not owned by user');
    }

    await this.repository.delete(id);
  }

  async getAirbnbVisits(propertyId: number, year: number): Promise<number> {
    const stats = await this.statisticsService.searchAll(
      { id: 0, email: '' } as JWTUser, // Internal call, bypass user check
      {
        propertyId,
        key: StatisticKey.AIRBNB_VISITS,
        year,
      },
    );

    // Find yearly stat (month is null)
    const yearlyStat = stats.find((s) => s.month === null);
    return yearlyStat ? parseInt(yearlyStat.value, 10) || 0 : 0;
  }

  calculateTravelDeduction(
    distanceKm: number,
    visits: number,
    year: number,
  ): { amount: number; ratePerKm: number } {
    const ratePerKm = getTravelCompensationRate(year);
    const roundTripKm = distanceKm * 2;
    const amount = roundTripKm * visits * ratePerKm;
    return { amount: Math.round(amount * 100) / 100, ratePerKm };
  }

  calculateLaundryDeduction(
    visits: number,
    pricePerLaundry?: number,
  ): { amount: number; pricePerLaundry: number } {
    const price = pricePerLaundry ?? DEFAULT_LAUNDRY_PRICE;
    const amount = visits * price;
    return { amount: Math.round(amount * 100) / 100, pricePerLaundry: price };
  }
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd backend && npm run test -- --testPathPattern=tax-deduction.service.spec.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add backend/src/real-estate/property/tax-deduction.service.ts
git commit -m "feat(tax): implement TaxDeductionService"
```

---

## Task 9: Create TaxDeductionController

**Files:**
- Create: `backend/src/real-estate/property/tax-deduction.controller.ts`

- [ ] **Step 1: Create controller**

Create `backend/src/real-estate/property/tax-deduction.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@asset-backend/auth/jwt-auth.guard';
import { User } from '@asset-backend/common/decorators/user.decorator';
import { JWTUser } from '@asset-backend/auth/types';
import { TaxDeductionService } from './tax-deduction.service';
import { TaxDeductionInputDto } from './dtos/tax-deduction-input.dto';
import { TaxDeductionDto, TaxDeductionCalculationDto } from './dtos/tax-deduction-response.dto';
import { getTravelCompensationRate, DEFAULT_LAUNDRY_PRICE } from './travel-compensation-rates';

@Controller('real-estate/property/tax/deductions')
@UseGuards(JwtAuthGuard)
export class TaxDeductionController {
  constructor(private readonly service: TaxDeductionService) {}

  @Get()
  async findAll(
    @User() user: JWTUser,
    @Query('year', ParseIntPipe) year: number,
    @Query('propertyId') propertyId?: string,
  ): Promise<TaxDeductionDto[]> {
    const propId = propertyId ? parseInt(propertyId, 10) : undefined;
    return this.service.findAllForYear(user, year, propId);
  }

  @Get('calculate')
  async getCalculation(
    @User() user: JWTUser,
    @Query('propertyId', ParseIntPipe) propertyId: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<TaxDeductionCalculationDto> {
    return this.service.getCalculationPreview(user, propertyId, year);
  }

  @Get('rates')
  getRates(@Query('year') yearStr?: string): { year: number; ratePerKm: number; defaultLaundryPrice: number } {
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
    return {
      year,
      ratePerKm: getTravelCompensationRate(year),
      defaultLaundryPrice: DEFAULT_LAUNDRY_PRICE,
    };
  }

  @Post()
  async create(
    @User() user: JWTUser,
    @Body() input: TaxDeductionInputDto,
  ): Promise<TaxDeductionDto> {
    return this.service.create(user, input);
  }

  @Put(':id')
  async update(
    @User() user: JWTUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() input: TaxDeductionInputDto,
  ): Promise<TaxDeductionDto> {
    return this.service.update(user, id, input);
  }

  @Delete(':id')
  async delete(
    @User() user: JWTUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.service.delete(user, id);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/real-estate/property/tax-deduction.controller.ts
git commit -m "feat(tax): create TaxDeductionController"
```

---

## Task 10: Register TaxDeduction in Module

**Files:**
- Modify: `backend/src/real-estate/real-estate.module.ts`

- [ ] **Step 1: Add TaxDeduction imports and providers**

In `backend/src/real-estate/real-estate.module.ts`:

Add import at top:
```typescript
import { TaxDeduction } from './property/entities/tax-deduction.entity';
import { TaxDeductionService } from './property/tax-deduction.service';
import { TaxDeductionController } from './property/tax-deduction.controller';
```

Add `TaxDeduction` to the TypeOrmModule.forFeature array:
```typescript
TypeOrmModule.forFeature([
  Property,
  // ... other entities
  TaxDeduction,
]),
```

Add `TaxDeductionService` to providers array.

Add `TaxDeductionController` to controllers array.

- [ ] **Step 2: Verify app starts**

Run: `cd backend && npm run start:dev`
Expected: Server starts without errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/real-estate/real-estate.module.ts
git commit -m "feat(tax): register TaxDeduction in RealEstateModule"
```

---

## Task 11: Integrate Tax Deductions into TaxService

**Files:**
- Modify: `backend/src/real-estate/property/tax.service.ts`
- Modify: `backend/src/real-estate/property/dtos/tax-response.dto.ts`

- [ ] **Step 1: Add TaxDeductionBreakdownDto to response DTOs**

Add to `backend/src/real-estate/property/dtos/tax-response.dto.ts`:

```typescript
import { TaxDeductionMetadata, TaxDeductionType, taxDeductionTypeNames } from '@asset-backend/common/types';

export class TaxDeductionBreakdownDto {
  id: number;
  type: TaxDeductionType;
  typeName: string;
  description: string | null;
  amount: number;
  metadata?: TaxDeductionMetadata;
}

// Update TaxResponseDto class to add:
export class TaxResponseDto {
  year: number;
  propertyId?: number;
  ownershipShare?: number;
  grossIncome: number;
  deductions: number;
  taxDeductions: number; // NEW
  depreciation: number;
  netIncome: number;
  breakdown: TaxBreakdownItemDto[];
  taxDeductionBreakdown?: TaxDeductionBreakdownDto[]; // NEW
  depreciationBreakdown?: DepreciationAssetBreakdownDto[];
  calculatedAt?: Date;
}
```

- [ ] **Step 2: Update TaxService to include tax deductions**

In `backend/src/real-estate/property/tax.service.ts`:

Add import:
```typescript
import { TaxDeduction } from './entities/tax-deduction.entity';
import { TaxDeductionBreakdownDto } from './dtos/tax-response.dto';
import { taxDeductionTypeNames } from '@asset-backend/common/types';
```

Add repository injection:
```typescript
@InjectRepository(TaxDeduction)
private taxDeductionRepository: Repository<TaxDeduction>,
```

Add method to calculate tax deductions:
```typescript
private async calculateTaxDeductions(
  propertyIds: number[],
  year: number,
  ownershipShares: Map<number, number>,
): Promise<{ total: number; breakdown: TaxDeductionBreakdownDto[] }> {
  const deductions = await this.taxDeductionRepository.find({
    where: {
      propertyId: In(propertyIds),
      year,
    },
  });

  let total = 0;
  const breakdown: TaxDeductionBreakdownDto[] = [];

  for (const d of deductions) {
    const share = ownershipShares.get(d.propertyId) ?? 100;
    const adjustedAmount = d.amount * (share / 100);
    total += adjustedAmount;

    breakdown.push({
      id: d.id,
      type: d.deductionType,
      typeName: taxDeductionTypeNames.get(d.deductionType) ?? 'custom',
      description: d.description,
      amount: adjustedAmount,
      metadata: d.metadata ?? undefined,
    });
  }

  return { total, breakdown };
}
```

Update `calculate()` method to call this and include in response:
```typescript
// After calculating deductions, add:
const { total: taxDeductionTotal, breakdown: taxDeductionBreakdown } =
  await this.calculateTaxDeductions(propertyIds, input.year, ownershipShares);

// Update netIncome calculation:
const netIncome = grossIncome - deductions - taxDeductionTotal - depreciation;

// Add to return object:
return {
  // ... existing fields
  taxDeductions: taxDeductionTotal,
  taxDeductionBreakdown,
  // ...
};
```

- [ ] **Step 3: Update emptyResponse**

```typescript
private emptyResponse(year: number, propertyId?: number): TaxResponseDto {
  return {
    year,
    propertyId,
    grossIncome: 0,
    deductions: 0,
    taxDeductions: 0,
    depreciation: 0,
    netIncome: 0,
    breakdown: [],
    taxDeductionBreakdown: [],
    depreciationBreakdown: [],
  };
}
```

- [ ] **Step 4: Run backend tests**

Run: `cd backend && npm run test`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/src/real-estate/property/tax.service.ts backend/src/real-estate/property/dtos/tax-response.dto.ts
git commit -m "feat(tax): integrate tax deductions into TaxService.calculate()"
```

---

## Task 12: Add Frontend Types

**Files:**
- Modify: `frontend/src/types/common.ts`
- Modify: `frontend/src/types/entities.ts`
- Modify: `frontend/src/types/inputs.ts`

- [ ] **Step 1: Add TaxDeductionType enum**

Add to `frontend/src/types/common.ts`:

```typescript
export enum TaxDeductionType {
  TRAVEL = 1,
  LAUNDRY = 2,
  CUSTOM = 3,
}
```

- [ ] **Step 2: Add TaxDeduction entity interface**

Add to `frontend/src/types/entities.ts`:

```typescript
import { TaxDeductionType } from './common';

export interface TaxDeductionMetadata {
  distanceKm?: number;
  visits?: number;
  ratePerKm?: number;
  pricePerLaundry?: number;
}

export interface TaxDeduction {
  id: number;
  propertyId: number;
  year: number;
  deductionType: TaxDeductionType;
  typeName: string;
  description: string | null;
  amount: number;
  metadata: TaxDeductionMetadata | null;
}

export interface TaxDeductionCalculation {
  propertyId: number;
  propertyName: string;
  year: number;
  visits: number;
  distanceKm: number | null;
  ratePerKm: number;
  defaultLaundryPrice: number;
  travelAmount: number;
  laundryAmount: number;
}
```

- [ ] **Step 3: Add TaxDeductionInput interface**

Add to `frontend/src/types/inputs.ts`:

```typescript
import { TaxDeductionType } from './common';
import { TaxDeductionMetadata } from './entities';

export interface TaxDeductionInput {
  id?: number;
  propertyId: number;
  year: number;
  deductionType: TaxDeductionType;
  description?: string;
  amount: number;
  metadata?: TaxDeductionMetadata;
}
```

- [ ] **Step 4: Add isAirbnb and distanceFromHome to Property interface**

In `frontend/src/types/entities.ts`, add to Property interface:
```typescript
isAirbnb?: boolean;
distanceFromHome?: number;
```

- [ ] **Step 5: Add to PropertyInput interface**

In `frontend/src/types/inputs.ts`, add to PropertyInput interface:
```typescript
isAirbnb?: boolean;
distanceFromHome?: number;
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/common.ts frontend/src/types/entities.ts frontend/src/types/inputs.ts
git commit -m "feat(tax): add frontend types for TaxDeduction"
```

---

## Task 13: Add Tax Deduction Translations

**Files:**
- Modify: `frontend/src/translations/tax/en.ts`
- Modify: `frontend/src/translations/tax/fi.ts`
- Modify: `frontend/src/translations/tax/sv.ts`
- Modify: `frontend/src/translations/property/en.ts`
- Modify: `frontend/src/translations/property/fi.ts`
- Modify: `frontend/src/translations/property/sv.ts`

- [ ] **Step 1: Add English tax translations**

Add to `frontend/src/translations/tax/en.ts`:

```typescript
  // Tax deductions
  taxDeductionsSection: 'Tax Deductions',
  taxDeductionsTotal: 'Total Tax Deductions',
  addTaxDeduction: 'Add Tax Deduction',
  travelExpenses: 'Travel Expenses',
  laundryExpenses: 'Laundry Expenses',
  customDeduction: 'Custom Deduction',
  travelDeductionTitle: 'Add Travel Expenses',
  laundryDeductionTitle: 'Add Laundry Expenses',
  customDeductionTitle: 'Add Custom Tax Deduction',
  distanceFromHome: 'Distance from home',
  visits: 'Visits',
  visitsFromStatistics: 'from statistics',
  ratePerKm: 'Compensation rate',
  roundTripDistance: 'Round trip distance',
  pricePerLaundry: 'Price per laundry',
  calculatedTotal: 'Calculated deduction',
  addDeduction: 'Add Deduction',
  editDeduction: 'Edit Deduction',
  deleteDeduction: 'Delete Deduction',
  deleteDeductionConfirm: 'Are you sure you want to delete this tax deduction?',
  deductionType: {
    travel: 'Travel',
    laundry: 'Laundry',
    custom: 'Custom',
  },
```

- [ ] **Step 2: Add Finnish tax translations**

Add to `frontend/src/translations/tax/fi.ts`:

```typescript
  // Tax deductions
  taxDeductionsSection: 'Verovähennykset',
  taxDeductionsTotal: 'Verovähennykset yhteensä',
  addTaxDeduction: 'Lisää verovähennys',
  travelExpenses: 'Matkakulut',
  laundryExpenses: 'Pyykkikulut',
  customDeduction: 'Muu vähennys',
  travelDeductionTitle: 'Lisää matkakulut',
  laundryDeductionTitle: 'Lisää pyykkikulut',
  customDeductionTitle: 'Lisää muu verovähennys',
  distanceFromHome: 'Etäisyys kotoa',
  visits: 'Käynnit',
  visitsFromStatistics: 'tilastoista',
  ratePerKm: 'Kilometrikorvaus',
  roundTripDistance: 'Edestakainen matka',
  pricePerLaundry: 'Hinta per pyykki',
  calculatedTotal: 'Laskettu vähennys',
  addDeduction: 'Lisää vähennys',
  editDeduction: 'Muokkaa vähennystä',
  deleteDeduction: 'Poista vähennys',
  deleteDeductionConfirm: 'Haluatko varmasti poistaa tämän verovähennyksen?',
  deductionType: {
    travel: 'Matka',
    laundry: 'Pyykki',
    custom: 'Muu',
  },
```

- [ ] **Step 3: Add Swedish tax translations**

Add to `frontend/src/translations/tax/sv.ts`:

```typescript
  // Tax deductions
  taxDeductionsSection: 'Skatteavdrag',
  taxDeductionsTotal: 'Skatteavdrag totalt',
  addTaxDeduction: 'Lägg till skatteavdrag',
  travelExpenses: 'Resekostnader',
  laundryExpenses: 'Tvättkostnader',
  customDeduction: 'Anpassat avdrag',
  travelDeductionTitle: 'Lägg till resekostnader',
  laundryDeductionTitle: 'Lägg till tvättkostnader',
  customDeductionTitle: 'Lägg till anpassat skatteavdrag',
  distanceFromHome: 'Avstånd från hemmet',
  visits: 'Besök',
  visitsFromStatistics: 'från statistik',
  ratePerKm: 'Kilometerersättning',
  roundTripDistance: 'Tur och retur',
  pricePerLaundry: 'Pris per tvätt',
  calculatedTotal: 'Beräknat avdrag',
  addDeduction: 'Lägg till avdrag',
  editDeduction: 'Redigera avdrag',
  deleteDeduction: 'Ta bort avdrag',
  deleteDeductionConfirm: 'Är du säker på att du vill ta bort detta skatteavdrag?',
  deductionType: {
    travel: 'Resa',
    laundry: 'Tvätt',
    custom: 'Anpassat',
  },
```

- [ ] **Step 4: Add English property translations**

Add to `frontend/src/translations/property/en.ts`:

```typescript
  // Airbnb settings
  airbnbSettingsSection: 'Airbnb Settings',
  isAirbnb: 'Airbnb property',
  distanceFromHome: 'Distance from home (km)',
```

- [ ] **Step 5: Add Finnish property translations**

Add to `frontend/src/translations/property/fi.ts`:

```typescript
  // Airbnb settings
  airbnbSettingsSection: 'Airbnb-asetukset',
  isAirbnb: 'Airbnb-kohde',
  distanceFromHome: 'Etäisyys kotoa (km)',
```

- [ ] **Step 6: Add Swedish property translations**

Add to `frontend/src/translations/property/sv.ts`:

```typescript
  // Airbnb settings
  airbnbSettingsSection: 'Airbnb-inställningar',
  isAirbnb: 'Airbnb-fastighet',
  distanceFromHome: 'Avstånd från hemmet (km)',
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/translations/tax/*.ts frontend/src/translations/property/*.ts
git commit -m "feat(tax): add translations for tax deductions and Airbnb settings"
```

---

## Task 14: Add Airbnb Settings to PropertyForm

**Files:**
- Modify: `frontend/src/components/property/PropertyForm.tsx`

- [ ] **Step 1: Add Airbnb settings section**

In `frontend/src/components/property/PropertyForm.tsx`, find the Monthly Costs section and add after it:

```tsx
{/* Airbnb Settings Section */}
<Divider sx={{ my: 2 }} />
<Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1 }}>
  {t('airbnbSettingsSection')}
</Typography>
<Stack direction="row" spacing={2} alignItems="center">
  <AssetSwitch
    label={t('isAirbnb')}
    checked={data.isAirbnb ?? false}
    onChange={(checked) => handleChange('isAirbnb', checked)}
  />
  {data.isAirbnb && (
    <Box sx={{ flex: 1, maxWidth: 200 }}>
      <AssetNumberField
        label={t('distanceFromHome')}
        value={data.distanceFromHome ?? ''}
        onChange={(e) => handleChange('distanceFromHome', e.target.value ? parseFloat(e.target.value) : undefined)}
        adornment="km"
      />
    </Box>
  )}
</Stack>
```

Add imports if needed:
```tsx
import { AssetSwitch } from '../asset';
```

- [ ] **Step 2: Verify it renders**

Run: `cd frontend && npm run dev`
Check PropertyForm in browser - Airbnb section should appear.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/property/PropertyForm.tsx
git commit -m "feat(property): add Airbnb settings section to PropertyForm"
```

---

## Task 15: Create TaxDeductionDialog Component

**Files:**
- Create: `frontend/src/components/tax/TaxDeductionDialog.tsx`
- Create: `frontend/src/components/tax/TravelDeductionForm.tsx`
- Create: `frontend/src/components/tax/LaundryDeductionForm.tsx`
- Create: `frontend/src/components/tax/CustomDeductionForm.tsx`

- [ ] **Step 1: Create TravelDeductionForm**

Create `frontend/src/components/tax/TravelDeductionForm.tsx`:

```tsx
import { Box, Typography, Stack, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AssetNumberField, AssetMoneyField } from '../asset';
import { TaxDeductionCalculation } from '../../types/entities';

interface TravelDeductionFormProps {
  calculation: TaxDeductionCalculation;
  distanceKm: number;
  ratePerKm: number;
  onDistanceChange: (value: number) => void;
  onRateChange: (value: number) => void;
}

function TravelDeductionForm({
  calculation,
  distanceKm,
  ratePerKm,
  onDistanceChange,
  onRateChange,
}: TravelDeductionFormProps) {
  const { t } = useTranslation('tax');

  const roundTrip = distanceKm * 2;
  const totalAmount = roundTrip * calculation.visits * ratePerKm;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('distanceFromHome')}
        </Typography>
        <AssetNumberField
          value={distanceKm}
          onChange={(e) => onDistanceChange(parseFloat(e.target.value) || 0)}
          adornment="km"
          fullWidth
        />
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('visits')}
        </Typography>
        <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="h6">
            {calculation.visits}
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({t('visitsFromStatistics')})
            </Typography>
          </Typography>
        </Box>
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('ratePerKm')} ({calculation.year})
        </Typography>
        <AssetMoneyField
          value={ratePerKm}
          onChange={(e) => onRateChange(parseFloat(e.target.value) || 0)}
          adornment="€/km"
          fullWidth
        />
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('roundTripDistance')}
        </Typography>
        <Box sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography>
            {roundTrip.toFixed(1)} km
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({distanceKm} × 2)
            </Typography>
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('calculatedTotal')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {roundTrip.toFixed(1)} km × {calculation.visits} × {ratePerKm.toFixed(2)} €/km
            </Typography>
          </Box>
          <Typography variant="h4" color="success.dark" fontWeight="bold">
            {totalAmount.toFixed(2)} €
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}

export default TravelDeductionForm;
```

- [ ] **Step 2: Create LaundryDeductionForm**

Create `frontend/src/components/tax/LaundryDeductionForm.tsx`:

```tsx
import { Box, Typography, Stack, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AssetMoneyField } from '../asset';
import { TaxDeductionCalculation } from '../../types/entities';

interface LaundryDeductionFormProps {
  calculation: TaxDeductionCalculation;
  pricePerLaundry: number;
  onPriceChange: (value: number) => void;
}

function LaundryDeductionForm({
  calculation,
  pricePerLaundry,
  onPriceChange,
}: LaundryDeductionFormProps) {
  const { t } = useTranslation('tax');

  const totalAmount = calculation.visits * pricePerLaundry;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('visits')}
        </Typography>
        <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="h6">
            {calculation.visits}
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({t('visitsFromStatistics')})
            </Typography>
          </Typography>
        </Box>
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('pricePerLaundry')}
        </Typography>
        <AssetMoneyField
          value={pricePerLaundry}
          onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
          fullWidth
        />
      </Box>

      <Divider />

      <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('calculatedTotal')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {calculation.visits} × {pricePerLaundry.toFixed(2)} €
            </Typography>
          </Box>
          <Typography variant="h4" color="success.dark" fontWeight="bold">
            {totalAmount.toFixed(2)} €
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}

export default LaundryDeductionForm;
```

- [ ] **Step 3: Create CustomDeductionForm**

Create `frontend/src/components/tax/CustomDeductionForm.tsx`:

```tsx
import { Box, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AssetTextField, AssetMoneyField } from '../asset';

interface CustomDeductionFormProps {
  description: string;
  amount: number;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: number) => void;
}

function CustomDeductionForm({
  description,
  amount,
  onDescriptionChange,
  onAmountChange,
}: CustomDeductionFormProps) {
  const { t } = useTranslation('tax');

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('description')} *
        </Typography>
        <AssetTextField
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          fullWidth
          placeholder={t('description')}
        />
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('amount')} *
        </Typography>
        <AssetMoneyField
          value={amount || ''}
          onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
          fullWidth
        />
      </Box>
    </Stack>
  );
}

export default CustomDeductionForm;
```

- [ ] **Step 4: Create main TaxDeductionDialog**

Create `frontend/src/components/tax/TaxDeductionDialog.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AssetDialog, AssetButton } from '../asset';
import ApiClient from '@asset-lib/api-client';
import { VITE_API_URL } from '../../constants';
import { TaxDeductionType } from '../../types/common';
import { TaxDeductionCalculation, TaxDeductionMetadata } from '../../types/entities';
import { TaxDeductionInput } from '../../types/inputs';
import TravelDeductionForm from './TravelDeductionForm';
import LaundryDeductionForm from './LaundryDeductionForm';
import CustomDeductionForm from './CustomDeductionForm';

interface TaxDeductionDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  propertyId: number;
  year: number;
  deductionType: TaxDeductionType;
}

function TaxDeductionDialog({
  open,
  onClose,
  onSaved,
  propertyId,
  year,
  deductionType,
}: TaxDeductionDialogProps) {
  const { t } = useTranslation('tax');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculation, setCalculation] = useState<TaxDeductionCalculation | null>(null);

  // Form state
  const [distanceKm, setDistanceKm] = useState(0);
  const [ratePerKm, setRatePerKm] = useState(0.30);
  const [pricePerLaundry, setPricePerLaundry] = useState(3.0);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (open && (deductionType === TaxDeductionType.TRAVEL || deductionType === TaxDeductionType.LAUNDRY)) {
      loadCalculation();
    } else if (open) {
      setLoading(false);
    }
  }, [open, propertyId, year, deductionType]);

  const loadCalculation = async () => {
    setLoading(true);
    try {
      const response = await axios.get<TaxDeductionCalculation>(
        `${VITE_API_URL}/real-estate/property/tax/deductions/calculate?propertyId=${propertyId}&year=${year}`,
        await ApiClient.getOptions()
      );
      setCalculation(response.data);
      setDistanceKm(response.data.distanceKm ?? 0);
      setRatePerKm(response.data.ratePerKm);
      setPricePerLaundry(response.data.defaultLaundryPrice);
    } catch (err) {
      console.error('Failed to load calculation', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let inputAmount = 0;
      let metadata: TaxDeductionMetadata | undefined;
      let desc: string | undefined;

      if (deductionType === TaxDeductionType.TRAVEL && calculation) {
        const roundTrip = distanceKm * 2;
        inputAmount = roundTrip * calculation.visits * ratePerKm;
        metadata = {
          distanceKm,
          visits: calculation.visits,
          ratePerKm,
        };
      } else if (deductionType === TaxDeductionType.LAUNDRY && calculation) {
        inputAmount = calculation.visits * pricePerLaundry;
        metadata = {
          visits: calculation.visits,
          pricePerLaundry,
        };
      } else {
        inputAmount = amount;
        desc = description;
      }

      const input: TaxDeductionInput = {
        propertyId,
        year,
        deductionType,
        description: desc,
        amount: inputAmount,
        metadata,
      };

      await axios.post(
        `${VITE_API_URL}/real-estate/property/tax/deductions`,
        input,
        await ApiClient.getOptions()
      );

      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save deduction', err);
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    switch (deductionType) {
      case TaxDeductionType.TRAVEL:
        return t('travelDeductionTitle');
      case TaxDeductionType.LAUNDRY:
        return t('laundryDeductionTitle');
      default:
        return t('customDeductionTitle');
    }
  };

  const canSave = () => {
    if (deductionType === TaxDeductionType.CUSTOM) {
      return description.trim() !== '' && amount > 0;
    }
    return true;
  };

  return (
    <AssetDialog
      open={open}
      onClose={onClose}
      title={`${getTitle()} - ${year}`}
      maxWidth="sm"
      actions={
        <>
          <AssetButton label={t('common:cancel')} onClick={onClose} />
          <AssetButton
            label={t('addDeduction')}
            variant="contained"
            onClick={handleSave}
            loading={saving}
            disabled={!canSave()}
          />
        </>
      }
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ pt: 1 }}>
          {calculation && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {calculation.propertyName}
            </Typography>
          )}

          {deductionType === TaxDeductionType.TRAVEL && calculation && (
            <TravelDeductionForm
              calculation={calculation}
              distanceKm={distanceKm}
              ratePerKm={ratePerKm}
              onDistanceChange={setDistanceKm}
              onRateChange={setRatePerKm}
            />
          )}

          {deductionType === TaxDeductionType.LAUNDRY && calculation && (
            <LaundryDeductionForm
              calculation={calculation}
              pricePerLaundry={pricePerLaundry}
              onPriceChange={setPricePerLaundry}
            />
          )}

          {deductionType === TaxDeductionType.CUSTOM && (
            <CustomDeductionForm
              description={description}
              amount={amount}
              onDescriptionChange={setDescription}
              onAmountChange={setAmount}
            />
          )}
        </Box>
      )}
    </AssetDialog>
  );
}

export default TaxDeductionDialog;
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/tax/TaxDeductionDialog.tsx frontend/src/components/tax/TravelDeductionForm.tsx frontend/src/components/tax/LaundryDeductionForm.tsx frontend/src/components/tax/CustomDeductionForm.tsx
git commit -m "feat(tax): create TaxDeductionDialog with Travel, Laundry, and Custom forms"
```

---

## Task 16: Update TaxView with Dropdown and Dialogs

**Files:**
- Modify: `frontend/src/components/tax/TaxView.tsx`

- [ ] **Step 1: Add imports and state**

Add imports at top of `frontend/src/components/tax/TaxView.tsx`:

```tsx
import { Menu, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { TaxDeductionType } from '../../types/common';
import TaxDeductionDialog from './TaxDeductionDialog';
```

Add state after existing useState calls:

```tsx
const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
const [dialogType, setDialogType] = useState<TaxDeductionType | null>(null);
const [isAirbnbProperty, setIsAirbnbProperty] = useState(false);
```

- [ ] **Step 2: Add handlers**

Add handlers:

```tsx
const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
  setMenuAnchor(event.currentTarget);
};

const handleMenuClose = () => {
  setMenuAnchor(null);
};

const handleDeductionSelect = (type: TaxDeductionType) => {
  setDialogType(type);
  handleMenuClose();
};

const handleDialogClose = () => {
  setDialogType(null);
};

const handleDeductionSaved = () => {
  fetchTaxData();
};
```

- [ ] **Step 3: Update UI to add dropdown button**

Find the Stack with year selector and add the dropdown button:

```tsx
<Stack
  direction="row"
  justifyContent="space-between"
  alignItems="center"
  sx={{ mb: 3 }}
>
  <FormControl size="small" sx={{ minWidth: 120 }}>
    {/* existing year selector */}
  </FormControl>

  {propertyId > 0 && (
    <>
      <AssetButton
        label={t('addTaxDeduction')}
        startIcon={<AddIcon />}
        onClick={handleMenuOpen}
        variant="contained"
      />
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {isAirbnbProperty && (
          <>
            <MenuItem onClick={() => handleDeductionSelect(TaxDeductionType.TRAVEL)}>
              {t('travelExpenses')}
            </MenuItem>
            <MenuItem onClick={() => handleDeductionSelect(TaxDeductionType.LAUNDRY)}>
              {t('laundryExpenses')}
            </MenuItem>
          </>
        )}
        <MenuItem onClick={() => handleDeductionSelect(TaxDeductionType.CUSTOM)}>
          {t('customDeduction')}
        </MenuItem>
      </Menu>
    </>
  )}
</Stack>
```

- [ ] **Step 4: Add dialog at end of component**

Before the closing `</ListPageTemplate>`, add:

```tsx
{dialogType !== null && propertyId > 0 && (
  <TaxDeductionDialog
    open={dialogType !== null}
    onClose={handleDialogClose}
    onSaved={handleDeductionSaved}
    propertyId={propertyId}
    year={selectedYear}
    deductionType={dialogType}
  />
)}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/tax/TaxView.tsx
git commit -m "feat(tax): add tax deduction dropdown menu and dialog to TaxView"
```

---

## Task 17: Update TaxBreakdown to Display Tax Deductions

**Files:**
- Modify: `frontend/src/components/tax/TaxBreakdown.tsx`

- [ ] **Step 1: Update interface and props**

Update TaxBreakdownProps interface:

```tsx
interface TaxDeductionBreakdown {
  id: number;
  type: number;
  typeName: string;
  description: string | null;
  amount: number;
  metadata?: {
    distanceKm?: number;
    visits?: number;
    ratePerKm?: number;
    pricePerLaundry?: number;
  };
}

interface TaxBreakdownProps {
  grossIncome: number;
  deductions: number;
  taxDeductions?: number;
  depreciation: number;
  netIncome: number;
  breakdown: BreakdownItem[];
  taxDeductionBreakdown?: TaxDeductionBreakdown[];
  depreciationBreakdown?: DepreciationAssetBreakdown[];
}
```

Update function signature:

```tsx
function TaxBreakdown({
  grossIncome,
  deductions,
  taxDeductions = 0,
  depreciation,
  netIncome,
  breakdown,
  taxDeductionBreakdown,
  depreciationBreakdown,
}: TaxBreakdownProps) {
```

- [ ] **Step 2: Add tax deductions section after expense deductions**

After the Deductions Total row and before the Depreciation section, add:

```tsx
{/* Tax Deductions Section */}
{taxDeductions > 0 && taxDeductionBreakdown && taxDeductionBreakdown.length > 0 && (
  <>
    <TableRow>
      <TableCell colSpan={2}>
        <Divider />
      </TableCell>
    </TableRow>
    <TableRow>
      <TableCell
        colSpan={2}
        sx={{ bgcolor: 'warning.light', fontWeight: 'bold' }}
      >
        {t('taxDeductionsSection')}
      </TableCell>
    </TableRow>
    {taxDeductionBreakdown.map((item) => (
      <TableRow key={item.id}>
        <TableCell sx={{ pl: 4 }}>
          <Box>
            <Typography variant="body2">
              {t(`deductionType.${item.typeName}`)}
              {item.description && ` - ${item.description}`}
            </Typography>
            {item.metadata && (
              <Typography variant="caption" color="text.secondary">
                {item.metadata.distanceKm && item.metadata.visits && item.metadata.ratePerKm && (
                  <>
                    {(item.metadata.distanceKm * 2).toFixed(1)} km × {item.metadata.visits} × {item.metadata.ratePerKm.toFixed(2)} €/km
                  </>
                )}
                {item.metadata.pricePerLaundry && item.metadata.visits && !item.metadata.distanceKm && (
                  <>
                    {item.metadata.visits} × {item.metadata.pricePerLaundry.toFixed(2)} €
                  </>
                )}
              </Typography>
            )}
          </Box>
        </TableCell>
        <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
      </TableRow>
    ))}
    <TableRow>
      <TableCell sx={{ fontWeight: 'bold' }}>
        {t('taxDeductionsTotal')}
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
        {formatCurrency(taxDeductions)}
      </TableCell>
    </TableRow>
  </>
)}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/tax/TaxBreakdown.tsx
git commit -m "feat(tax): display tax deductions section in TaxBreakdown"
```

---

## Task 18: Update TaxView to Pass Tax Deductions to Breakdown

**Files:**
- Modify: `frontend/src/components/tax/TaxView.tsx`

- [ ] **Step 1: Update TaxData interface**

Update TaxData interface to include taxDeductions:

```tsx
interface TaxDeductionBreakdown {
  id: number;
  type: number;
  typeName: string;
  description: string | null;
  amount: number;
  metadata?: {
    distanceKm?: number;
    visits?: number;
    ratePerKm?: number;
    pricePerLaundry?: number;
  };
}

interface TaxData {
  year: number;
  propertyId?: number;
  ownershipShare?: number;
  grossIncome: number;
  deductions: number;
  taxDeductions?: number;
  depreciation: number;
  netIncome: number;
  breakdown: BreakdownItem[];
  taxDeductionBreakdown?: TaxDeductionBreakdown[];
  depreciationBreakdown?: DepreciationAssetBreakdown[];
  calculatedAt?: string;
}
```

- [ ] **Step 2: Pass taxDeductions props to TaxBreakdown**

Update the TaxBreakdown component call:

```tsx
<TaxBreakdown
  grossIncome={taxData.grossIncome}
  deductions={taxData.deductions}
  taxDeductions={taxData.taxDeductions}
  depreciation={taxData.depreciation}
  netIncome={taxData.netIncome}
  breakdown={taxData.breakdown}
  taxDeductionBreakdown={taxData.taxDeductionBreakdown}
  depreciationBreakdown={taxData.depreciationBreakdown}
/>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/tax/TaxView.tsx
git commit -m "feat(tax): pass tax deduction data to TaxBreakdown"
```

---

## Task 19: Create E2E Tests

**Files:**
- Create: `backend/test/tax-deduction.e2e-spec.ts`

- [ ] **Step 1: Write E2E tests**

Create `backend/test/tax-deduction.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getAuthToken, createTestProperty, cleanupTestData } from './helper-functions';
import { TaxDeductionType } from '@asset-backend/common/types';

describe('TaxDeductionController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let propertyId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authToken = await getAuthToken(app);
    propertyId = await createTestProperty(app, authToken, { isAirbnb: true, distanceFromHome: 25 });
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await app.close();
  });

  describe('POST /api/real-estate/property/tax/deductions', () => {
    it('should create a travel deduction', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/real-estate/property/tax/deductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.TRAVEL,
          amount: 360,
          metadata: { distanceKm: 25, visits: 24, ratePerKm: 0.30 },
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.amount).toBe(360);
      expect(response.body.typeName).toBe('travel');
    });

    it('should create a custom deduction', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/real-estate/property/tax/deductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.CUSTOM,
          description: 'Test custom deduction',
          amount: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body.description).toBe('Test custom deduction');
    });
  });

  describe('GET /api/real-estate/property/tax/deductions', () => {
    it('should return deductions for year', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/real-estate/property/tax/deductions?year=2025')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/real-estate/property/tax/deductions/calculate', () => {
    it('should return calculation preview', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/real-estate/property/tax/deductions/calculate?propertyId=${propertyId}&year=2025`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.distanceKm).toBe(25);
      expect(response.body.ratePerKm).toBeDefined();
    });
  });

  describe('DELETE /api/real-estate/property/tax/deductions/:id', () => {
    it('should delete a deduction', async () => {
      // First create one to delete
      const createResponse = await request(app.getHttpServer())
        .post('/api/real-estate/property/tax/deductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.CUSTOM,
          description: 'To delete',
          amount: 50,
        });

      const id = createResponse.body.id;

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/real-estate/property/tax/deductions/${id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
    });
  });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `cd backend && npm run test:e2e -- --testPathPattern=tax-deduction`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add backend/test/tax-deduction.e2e-spec.ts
git commit -m "test(tax): add E2E tests for TaxDeductionController"
```

---

## Task 20: Run Full Test Suite and Final Verification

- [ ] **Step 1: Run backend tests**

Run: `cd backend && npm run test`
Expected: All tests pass

- [ ] **Step 2: Run frontend tests**

Run: `cd frontend && npm run test`
Expected: All tests pass

- [ ] **Step 3: Run backend E2E tests**

Run: `cd backend && npm run test:e2e`
Expected: All tests pass

- [ ] **Step 4: Start dev servers and manual verification**

Run: `docker-compose up -d`

Manual verification steps:
1. Create/edit a property, mark it as Airbnb, set distance
2. Create Airbnb income records for the property
3. Go to Tax Reports, select the property
4. Click "Add Tax Deduction" dropdown
5. Add travel, laundry, and custom deductions
6. Click "Calculate tax data"
7. Verify tax deductions appear in breakdown
8. Verify net income is reduced by deduction amounts

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(tax): complete tax deductions feature implementation"
```

---

## Verification Checklist

- [ ] Property form shows Airbnb toggle and distance field
- [ ] Tax View shows "Add Tax Deduction" dropdown when property selected
- [ ] Dropdown shows Travel/Laundry only for Airbnb properties
- [ ] Travel dialog calculates: distance × 2 × visits × rate
- [ ] Laundry dialog calculates: visits × price
- [ ] Custom dialog requires description and amount
- [ ] Tax deductions appear in breakdown with calculation details
- [ ] Net taxable income is reduced by deduction amounts
- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] E2E tests pass
