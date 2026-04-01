# Property Charges UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate PropertyChargeDialog into the UI and migrate from property entity charge fields to property_charge table exclusively.

**Architecture:** PropertyForm saves charges via batch API after property creation. PropertyInfoSection fetches current charges from API. PropertyChargeDialog accessible from both view and edit modes.

**Tech Stack:** NestJS, TypeORM, React, TypeScript, Material-UI

---

## File Structure

### Backend Files
| File | Responsibility |
|------|----------------|
| `backend/src/migrations/1775100000000-MakeStartDateNullableAndDropPropertyChargeFields.ts` | Schema changes |
| `backend/src/real-estate/property/entities/property-charge.entity.ts` | Make startDate nullable |
| `backend/src/real-estate/property/entities/property.entity.ts` | Remove charge fields |
| `backend/src/real-estate/property/dtos/property-charge-input.dto.ts` | Allow null startDate |
| `backend/src/real-estate/property/dtos/property-input.dto.ts` | Remove charge fields |
| `backend/src/real-estate/property/property-charge.service.ts` | Add createBatch method |
| `backend/src/real-estate/property/property-charge.controller.ts` | Add batch endpoint |
| `backend/src/import/oikotie/oikotie-import.service.ts` | Use charge API |
| `backend/src/import/etuovi/etuovi-import.service.ts` | Use charge API |

### Frontend Files
| File | Responsibility |
|------|----------------|
| `frontend/src/types/entities.ts` | Remove charge fields from Property |
| `frontend/src/types/inputs.ts` | Remove charge fields, allow null startDate |
| `frontend/src/components/property/PropertyForm.tsx` | Separate charge state, batch save |
| `frontend/src/components/property/sections/PropertyInfoSection.tsx` | Fetch charges, add history button |

---

## Task 1: Backend Migration - Make startDate Nullable and Drop Columns

**Files:**
- Create: `backend/src/migrations/1775100000000-MakeStartDateNullableAndDropPropertyChargeFields.ts`

- [ ] **Step 1: Create the migration file**

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeStartDateNullableAndDropPropertyChargeFields1775100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make startDate nullable in property_charge
    await queryRunner.query(`
      ALTER TABLE property_charge
      ALTER COLUMN "startDate" DROP NOT NULL
    `);

    // Drop charge columns from property table
    await queryRunner.query(`
      ALTER TABLE property
      DROP COLUMN IF EXISTS "maintenanceFee",
      DROP COLUMN IF EXISTS "financialCharge",
      DROP COLUMN IF EXISTS "waterCharge"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore charge columns to property table
    await queryRunner.query(`
      ALTER TABLE property
      ADD COLUMN IF NOT EXISTS "maintenanceFee" DECIMAL(12,2),
      ADD COLUMN IF NOT EXISTS "financialCharge" DECIMAL(12,2),
      ADD COLUMN IF NOT EXISTS "waterCharge" DECIMAL(12,2)
    `);

    // Make startDate NOT NULL again (set nulls to epoch first)
    await queryRunner.query(`
      UPDATE property_charge
      SET "startDate" = '1970-01-01'
      WHERE "startDate" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE property_charge
      ALTER COLUMN "startDate" SET NOT NULL
    `);
  }
}
```

- [ ] **Step 2: Verify migration file is in migrations index**

Check that `backend/src/migrations/index.ts` exports all migrations (TypeORM auto-discovers from folder).

- [ ] **Step 3: Commit**

```bash
git add backend/src/migrations/1775100000000-MakeStartDateNullableAndDropPropertyChargeFields.ts
git commit -m "feat: add migration to make startDate nullable and drop property charge columns"
```

---

## Task 2: Update PropertyCharge Entity - Nullable startDate

**Files:**
- Modify: `backend/src/real-estate/property/entities/property-charge.entity.ts:35-36`

- [ ] **Step 1: Update the startDate column to be nullable**

Change line 35-36 from:
```typescript
  @Column({ type: 'date' })
  startDate: Date;
```

To:
```typescript
  @Column({ type: 'date', nullable: true })
  startDate: Date | null;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/real-estate/property/entities/property-charge.entity.ts
git commit -m "feat: make PropertyCharge.startDate nullable"
```

---

## Task 3: Update Property Entity - Remove Charge Fields

**Files:**
- Modify: `backend/src/real-estate/property/entities/property.entity.ts:139-156`

- [ ] **Step 1: Remove maintenanceFee, financialCharge, waterCharge columns**

Delete these column definitions (lines 139-173):
```typescript
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: new DecimalToNumberTransformer(),
  })
  public maintenanceFee?: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: new DecimalToNumberTransformer(),
  })
  public financialCharge?: number;
```

And delete waterCharge (lines 166-173):
```typescript
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: new DecimalToNumberTransformer(),
  })
  public waterCharge?: number;
```

Keep `monthlyRent` - it stays on property.

- [ ] **Step 2: Commit**

```bash
git add backend/src/real-estate/property/entities/property.entity.ts
git commit -m "feat: remove charge fields from Property entity"
```

---

## Task 4: Update PropertyInputDto - Remove Charge Fields

**Files:**
- Modify: `backend/src/real-estate/property/dtos/property-input.dto.ts`

- [ ] **Step 1: Remove charge field decorators and properties**

Remove these field definitions:
```typescript
  @IsOptional()
  @IsNumber()
  maintenanceFee?: number;

  @IsOptional()
  @IsNumber()
  financialCharge?: number;

  @IsOptional()
  @IsNumber()
  waterCharge?: number;
```

Keep `monthlyRent`.

- [ ] **Step 2: Commit**

```bash
git add backend/src/real-estate/property/dtos/property-input.dto.ts
git commit -m "feat: remove charge fields from PropertyInputDto"
```

---

## Task 5: Update PropertyChargeInputDto - Allow Null startDate

**Files:**
- Modify: `backend/src/real-estate/property/dtos/property-charge-input.dto.ts:20-22`

- [ ] **Step 1: Make startDate optional and allow null**

Change:
```typescript
  @IsNotEmpty()
  @IsDateString()
  startDate: string;
```

To:
```typescript
  @IsOptional()
  @IsDateString()
  startDate?: string | null;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/real-estate/property/dtos/property-charge-input.dto.ts
git commit -m "feat: allow null startDate in PropertyChargeInputDto"
```

---

## Task 6: Add createBatch to PropertyChargeService

**Files:**
- Modify: `backend/src/real-estate/property/property-charge.service.ts`
- Test: `backend/src/real-estate/property/property-charge.service.spec.ts`

- [ ] **Step 1: Write the failing test for createBatch**

Add to `property-charge.service.spec.ts`:

```typescript
describe('createBatch', () => {
  it('should create multiple charges and auto-calculate total', async () => {
    const inputs: PropertyChargeInputDto[] = [
      { propertyId: 1, chargeType: ChargeType.MAINTENANCE_FEE, amount: 150, startDate: '2024-01-15' },
      { propertyId: 1, chargeType: ChargeType.FINANCIAL_CHARGE, amount: 50, startDate: '2024-01-15' },
      { propertyId: 1, chargeType: ChargeType.WATER_PREPAYMENT, amount: 25, startDate: '2024-01-15' },
    ];

    const result = await service.createBatch(mockUser, 1, inputs);

    expect(result).toHaveLength(4); // 3 inputs + 1 auto-calculated total
    expect(result.find(c => c.chargeType === ChargeType.TOTAL_CHARGE)?.amount).toBe(225);
  });

  it('should allow null startDate', async () => {
    const inputs: PropertyChargeInputDto[] = [
      { propertyId: 1, chargeType: ChargeType.MAINTENANCE_FEE, amount: 100, startDate: null },
    ];

    const result = await service.createBatch(mockUser, 1, inputs);

    expect(result).toHaveLength(2);
    expect(result[0].startDate).toBeNull();
  });

  it('should throw NotFoundException for invalid property', async () => {
    jest.spyOn(propertyService, 'findOne').mockResolvedValue(null);

    await expect(
      service.createBatch(mockUser, 999, [{ propertyId: 999, chargeType: ChargeType.MAINTENANCE_FEE, amount: 100, startDate: null }])
    ).rejects.toThrow(NotFoundException);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm test -- --testPathPattern="property-charge.service.spec" --testNamePattern="createBatch"
```

Expected: FAIL with "service.createBatch is not a function"

- [ ] **Step 3: Implement createBatch method**

Add to `property-charge.service.ts` after `create` method:

```typescript
async createBatch(
  user: JWTUser,
  propertyId: number,
  inputs: PropertyChargeInputDto[],
): Promise<PropertyChargeDto[]> {
  const property = await this.propertyService.findOne(user, propertyId);
  if (!property) {
    throw new NotFoundException('Property not found');
  }

  const results: PropertyChargeDto[] = [];
  let hasComponentCharges = false;

  for (const input of inputs) {
    // Skip if amount is 0 or not provided
    if (!input.amount || input.amount === 0) {
      continue;
    }

    const charge = this.repository.create({
      propertyId,
      chargeType: input.chargeType,
      amount: input.amount,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
    });

    const savedCharge = await this.repository.save(charge);
    results.push(PropertyChargeDto.fromEntity(savedCharge));

    if (input.chargeType !== ChargeType.TOTAL_CHARGE) {
      hasComponentCharges = true;
    }
  }

  // Auto-calculate total charge if we have component charges
  if (hasComponentCharges) {
    const total = results
      .filter(c => c.chargeType !== ChargeType.TOTAL_CHARGE)
      .reduce((sum, c) => sum + c.amount, 0);

    const startDate = inputs[0]?.startDate ? new Date(inputs[0].startDate) : null;

    const totalCharge = this.repository.create({
      propertyId,
      chargeType: ChargeType.TOTAL_CHARGE,
      amount: total,
      startDate,
      endDate: null,
    });

    const savedTotal = await this.repository.save(totalCharge);
    results.push(PropertyChargeDto.fromEntity(savedTotal));
  }

  return results;
}
```

- [ ] **Step 4: Update create method to handle null startDate**

In the `create` method, change:
```typescript
const startDate = new Date(input.startDate);
```

To:
```typescript
const startDate = input.startDate ? new Date(input.startDate) : null;
```

And update `closeOpenCharges` call:
```typescript
if (startDate) {
  await this.closeOpenCharges(input.propertyId, input.chargeType, startDate);
}
```

- [ ] **Step 5: Update getCurrentCharges to handle null startDate**

In `getCurrentCharges`, change the query to also include charges with null startDate:
```typescript
const charges = await this.repository
  .createQueryBuilder('charge')
  .where('charge.propertyId = :propertyId', { propertyId })
  .andWhere('(charge.startDate IS NULL OR charge.startDate <= :today)', { today })
  .andWhere('(charge.endDate IS NULL OR charge.endDate >= :today)', { today })
  .getMany();
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd backend && npm test -- --testPathPattern="property-charge.service.spec"
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/real-estate/property/property-charge.service.ts backend/src/real-estate/property/property-charge.service.spec.ts
git commit -m "feat: add createBatch method to PropertyChargeService"
```

---

## Task 7: Add Batch Endpoint to Controller

**Files:**
- Modify: `backend/src/real-estate/property/property-charge.controller.ts`
- Test: `backend/test/property-charge.e2e-spec.ts`

- [ ] **Step 1: Write the failing e2e test**

Add to `property-charge.e2e-spec.ts`:

```typescript
describe('POST /api/real-estate/property/:id/charges/batch', () => {
  it('should create multiple charges', async () => {
    const inputs = [
      { chargeType: ChargeType.MAINTENANCE_FEE, amount: 150, startDate: '2024-01-15' },
      { chargeType: ChargeType.FINANCIAL_CHARGE, amount: 50, startDate: '2024-01-15' },
    ];

    const response = await request(app.getHttpServer())
      .post(`/api/real-estate/property/${testPropertyId}/charges/batch`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(inputs)
      .expect(201);

    expect(response.body).toHaveLength(3); // 2 inputs + 1 total
    expect(response.body.find((c: any) => c.chargeType === ChargeType.TOTAL_CHARGE).amount).toBe(200);
  });

  it('should allow null startDate', async () => {
    const inputs = [
      { chargeType: ChargeType.MAINTENANCE_FEE, amount: 100, startDate: null },
    ];

    const response = await request(app.getHttpServer())
      .post(`/api/real-estate/property/${testPropertyId}/charges/batch`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(inputs)
      .expect(201);

    expect(response.body[0].startDate).toBeNull();
  });

  it('should return 404 for non-existent property', async () => {
    await request(app.getHttpServer())
      .post('/api/real-estate/property/99999/charges/batch')
      .set('Authorization', `Bearer ${authToken}`)
      .send([{ chargeType: ChargeType.MAINTENANCE_FEE, amount: 100, startDate: null }])
      .expect(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm run test:e2e -- --testPathPattern="property-charge"
```

Expected: FAIL with 404

- [ ] **Step 3: Add the batch endpoint to controller**

Add to `property-charge.controller.ts` after the `create` method:

```typescript
@Post(':id/charges/batch')
async createBatch(
  @User() user: JWTUser,
  @Param('id', ParseIntPipe) propertyId: number,
  @Body() inputs: PropertyChargeInputDto[],
): Promise<PropertyChargeDto[]> {
  return this.service.createBatch(user, propertyId, inputs);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && npm run test:e2e -- --testPathPattern="property-charge"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/real-estate/property/property-charge.controller.ts backend/test/property-charge.e2e-spec.ts
git commit -m "feat: add batch endpoint for property charges"
```

---

## Task 8: Update Oikotie Import Service

**Files:**
- Modify: `backend/src/import/oikotie/oikotie-import.service.ts`
- Modify: `backend/src/import/oikotie/oikotie-import.service.spec.ts`

- [ ] **Step 1: Inject PropertyChargeService**

Add to constructor:
```typescript
constructor(
  private readonly propertyService: PropertyService,
  private readonly propertyChargeService: PropertyChargeService,
) {}
```

Add import:
```typescript
import { PropertyChargeService } from '@asset-backend/real-estate/property/property-charge.service';
import { ChargeType } from '@asset-backend/common/types';
```

- [ ] **Step 2: Update createProspectProperty to create charges**

After property is created/updated, add charge creation:

```typescript
async createProspectProperty(
  user: JWTUser,
  url: string,
  monthlyRent?: number,
): Promise<Property> {
  const oikotieData = await this.fetchPropertyData(url);
  const propertyInput = this.createPropertyInput(oikotieData);

  if (monthlyRent !== undefined) {
    propertyInput.monthlyRent = monthlyRent;
  }

  const existingProperty = await this.propertyService.findByExternalSource(
    user,
    PropertyExternalSource.OIKOTIE,
    propertyInput.externalSourceId,
  );

  let property: Property;
  if (existingProperty) {
    this.logger.debug(
      `Updating existing property ${existingProperty.id} from Oikotie listing ${propertyInput.externalSourceId}`,
    );
    property = await this.propertyService.update(user, existingProperty.id, propertyInput);
  } else {
    this.logger.debug(
      `Creating new prospect property from Oikotie listing ${propertyInput.externalSourceId}`,
    );
    property = await this.propertyService.add(user, propertyInput);
  }

  // Create charges from scraped data
  await this.createChargesFromOikotieData(user, property.id, oikotieData);

  return property;
}

private async createChargesFromOikotieData(
  user: JWTUser,
  propertyId: number,
  data: OikotiePropertyDataDto,
): Promise<void> {
  const charges: PropertyChargeInputDto[] = [];

  if (data.maintenanceFee && data.maintenanceFee > 0) {
    charges.push({
      propertyId,
      chargeType: ChargeType.MAINTENANCE_FEE,
      amount: data.maintenanceFee,
      startDate: null,
    });
  }

  if (data.financingFee && data.financingFee > 0) {
    charges.push({
      propertyId,
      chargeType: ChargeType.FINANCIAL_CHARGE,
      amount: data.financingFee,
      startDate: null,
    });
  }

  if (data.waterFee && data.waterFee > 0) {
    charges.push({
      propertyId,
      chargeType: ChargeType.WATER_PREPAYMENT,
      amount: data.waterFee,
      startDate: null,
    });
  }

  if (charges.length > 0) {
    await this.propertyChargeService.createBatch(user, propertyId, charges);
  }
}
```

- [ ] **Step 3: Remove charge fields from createPropertyInput**

In `createPropertyInput`, remove these lines:
```typescript
input.maintenanceFee = oikotieData.maintenanceFee;
input.financialCharge = oikotieData.financingFee;
input.waterCharge = oikotieData.waterFee;
```

- [ ] **Step 4: Update the import module to provide PropertyChargeService**

Check `backend/src/import/oikotie/oikotie-import.module.ts` imports PropertyChargeService.

- [ ] **Step 5: Update unit tests**

Update mocks in `oikotie-import.service.spec.ts` to mock PropertyChargeService:

```typescript
const mockPropertyChargeService = {
  createBatch: jest.fn().mockResolvedValue([]),
};

// In module setup:
{
  provide: PropertyChargeService,
  useValue: mockPropertyChargeService,
}
```

- [ ] **Step 6: Run tests**

```bash
cd backend && npm test -- --testPathPattern="oikotie-import"
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/import/oikotie/
git commit -m "feat: update Oikotie import to use charge API"
```

---

## Task 9: Update Etuovi Import Service

**Files:**
- Modify: `backend/src/import/etuovi/etuovi-import.service.ts`
- Modify: `backend/src/import/etuovi/etuovi-import.service.spec.ts`

- [ ] **Step 1: Apply same pattern as Oikotie**

Inject PropertyChargeService and create charges after property creation. Follow the same pattern as Task 8.

- [ ] **Step 2: Run tests**

```bash
cd backend && npm test -- --testPathPattern="etuovi-import"
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add backend/src/import/etuovi/
git commit -m "feat: update Etuovi import to use charge API"
```

---

## Task 10: Update Frontend Types

**Files:**
- Modify: `frontend/src/types/entities.ts:58-88`
- Modify: `frontend/src/types/inputs.ts:32-57`

- [ ] **Step 1: Remove charge fields from Property interface**

In `entities.ts`, remove from Property interface:
```typescript
maintenanceFee?: number;
financialCharge?: number;
waterCharge?: number;
```

Keep `monthlyRent`.

- [ ] **Step 2: Remove charge fields from PropertyInput interface**

In `inputs.ts`, remove from PropertyInput interface:
```typescript
maintenanceFee?: number;
financialCharge?: number;
waterCharge?: number;
```

- [ ] **Step 3: Update PropertyChargeInput to allow null startDate**

In `inputs.ts`, change:
```typescript
startDate: string;
```

To:
```typescript
startDate: string | null;
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/entities.ts frontend/src/types/inputs.ts
git commit -m "feat: update frontend types - remove charge fields, allow null startDate"
```

---

## Task 11: Update PropertyInfoSection - Fetch Charges and Add History Button

**Files:**
- Modify: `frontend/src/components/property/sections/PropertyInfoSection.tsx`
- Test: `frontend/src/components/property/sections/PropertyInfoSection.test.tsx`

- [ ] **Step 1: Add state and fetch for current charges**

```typescript
import { useState, useEffect } from 'react';
import ApiClient from '@asset-lib/api-client';
import { CurrentCharges } from '@asset-types';
import PropertyChargeDialog from './PropertyChargeDialog';
import HistoryIcon from '@mui/icons-material/History';
import { IconButton, Tooltip } from '@mui/material';

// Inside component:
const [currentCharges, setCurrentCharges] = useState<CurrentCharges | null>(null);
const [chargeDialogOpen, setChargeDialogOpen] = useState(false);

useEffect(() => {
  const fetchCharges = async () => {
    try {
      const charges = await ApiClient.request<CurrentCharges>({
        method: 'GET',
        url: `/real-estate/property/${property.id}/charges/current`,
      });
      setCurrentCharges(charges);
    } catch {
      // Silently fail - charges will show as empty
    }
  };
  fetchCharges();
}, [property.id]);

const handleChargesUpdated = () => {
  // Refetch charges
  ApiClient.request<CurrentCharges>({
    method: 'GET',
    url: `/real-estate/property/${property.id}/charges/current`,
  }).then(setCurrentCharges);
};
```

- [ ] **Step 2: Update hasCosts and totalMonthlyCosts calculations**

```typescript
const hasCosts =
  currentCharges?.maintenanceFee !== null ||
  currentCharges?.waterPrepayment !== null ||
  currentCharges?.financialCharge !== null;

const totalMonthlyCosts =
  (currentCharges?.maintenanceFee ?? 0) +
  (currentCharges?.waterPrepayment ?? 0) +
  (currentCharges?.financialCharge ?? 0);
```

- [ ] **Step 3: Update Monthly Costs card to use currentCharges and add history button**

```typescript
{hasCosts && (
  <Grid size={{ xs: 12, md: 6 }}>
    <PropertyInfoCard
      title={t('monthlyCostsSection')}
      action={
        <Tooltip title={t('chargeHistory')}>
          <IconButton
            size="small"
            onClick={() => setChargeDialogOpen(true)}
            aria-label={t('chargeHistory')}
          >
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      }
    >
      {currentCharges?.maintenanceFee !== null && (
        <DetailRow
          icon={<HomeWorkIcon fontSize="small" />}
          label={t('maintenanceFee')}
          value={`${formatCurrency(currentCharges.maintenanceFee, 2)}${t('perMonth')}`}
        />
      )}
      {currentCharges?.waterPrepayment !== null && (
        <DetailRow
          icon={<WaterDropIcon fontSize="small" />}
          label={t('waterPrepayment')}
          value={`${formatCurrency(currentCharges.waterPrepayment, 2)}${t('perMonth')}`}
        />
      )}
      {currentCharges?.financialCharge !== null && (
        <DetailRow
          icon={<AccountBalanceIcon fontSize="small" />}
          label={t('financialCharge')}
          value={`${formatCurrency(currentCharges.financialCharge, 2)}${t('perMonth')}`}
        />
      )}
      {totalMonthlyCosts > 0 && (
        <DetailRow
          icon={<CalculateIcon fontSize="small" />}
          label={t('totalMonthlyCosts')}
          value={`${formatCurrency(totalMonthlyCosts, 2)}${t('perMonth')}`}
        />
      )}
    </PropertyInfoCard>
  </Grid>
)}

<PropertyChargeDialog
  open={chargeDialogOpen}
  propertyId={property.id}
  onClose={() => setChargeDialogOpen(false)}
  onChargesUpdated={handleChargesUpdated}
/>
```

- [ ] **Step 4: Update PropertyInfoCard to accept action prop**

In `frontend/src/components/property/shared/PropertyInfoCard.tsx`, add action prop:

```typescript
interface PropertyInfoCardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

function PropertyInfoCard({ title, children, action }: PropertyInfoCardProps) {
  return (
    <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Stack spacing={1}>
        {children}
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 5: Update tests to mock charge API**

In `PropertyInfoSection.test.tsx`, add MSW handler:

```typescript
server.use(
  http.get('/api/real-estate/property/:id/charges/current', () => {
    return HttpResponse.json({
      maintenanceFee: 150,
      financialCharge: 50,
      waterPrepayment: 25,
      totalCharge: 225,
    });
  }),
);
```

- [ ] **Step 6: Run tests**

```bash
cd frontend && npm test -- --testPathPattern="PropertyInfoSection"
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/property/sections/PropertyInfoSection.tsx frontend/src/components/property/sections/PropertyInfoSection.test.tsx frontend/src/components/property/shared/PropertyInfoCard.tsx
git commit -m "feat: update PropertyInfoSection to fetch charges and add history button"
```

---

## Task 12: Update PropertyForm - Separate Charge State and Batch Save

**Files:**
- Modify: `frontend/src/components/property/PropertyForm.tsx`
- Test: `frontend/src/components/property/PropertyForm.test.tsx`

- [ ] **Step 1: Add charge-specific state separate from property data**

```typescript
// Add these state variables after the existing state declarations:
const [charges, setCharges] = useState({
  maintenanceFee: 0,
  financialCharge: 0,
  waterCharge: 0,
  totalCharge: 0,
});
const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
const isEditMode = !!idParam && Number(idParam) > 0;
```

- [ ] **Step 2: Fetch current charges in edit mode**

```typescript
useEffect(() => {
  if (isEditMode) {
    ApiClient.request<CurrentCharges>({
      method: 'GET',
      url: `/real-estate/property/${idParam}/charges/current`,
    }).then((result) => {
      setCharges({
        maintenanceFee: result.maintenanceFee ?? 0,
        financialCharge: result.financialCharge ?? 0,
        waterCharge: result.waterPrepayment ?? 0,
        totalCharge: result.totalCharge ?? 0,
      });
    }).catch(() => {
      // Silently fail
    });
  }
}, [isEditMode, idParam]);
```

- [ ] **Step 3: Update handleChargeChange to use charges state**

```typescript
const handleChargeChange = useCallback((
  field: ChargeFieldName,
  value: number | undefined
) => {
  const numValue = value ?? 0;

  setCharges(prev => {
    const updated = { ...prev, [field]: numValue };

    touchedChargeFieldsRef.current.add(field);

    const currentValues: ChargeValues = {
      maintenanceFee: field === 'maintenanceFee' ? numValue : prev.maintenanceFee,
      financialCharge: field === 'financialCharge' ? numValue : prev.financialCharge,
      totalCharge: field === 'totalCharge' ? numValue : prev.totalCharge,
    };

    const calculated = calculateCharge(currentValues, touchedChargeFieldsRef.current);
    if (calculated) {
      updated[calculated.field] = calculated.value;
    }

    return updated;
  });
}, []);
```

- [ ] **Step 4: Update handleSaveResult to create charges via batch API**

```typescript
const handleSaveResult = async (result: DTO<PropertyInput>) => {
  const savedProperty = 'data' in result && result.data ? (result.data as DTO<PropertyInput>) : result;
  const propertyId = savedProperty.id;

  // Auto-select the newly created property in PropertyBadge
  if (!idParam && propertyId) {
    setTransactionPropertyId(propertyId);
    window.dispatchEvent(
      new CustomEvent(TRANSACTION_PROPERTY_CHANGE_EVENT, {
        detail: { propertyId },
      })
    );
    window.dispatchEvent(new CustomEvent(PROPERTY_LIST_CHANGE_EVENT));
  }

  // Upload pending photo
  if (pendingPhoto && propertyId) {
    try {
      const formData = new FormData();
      formData.append('photo', pendingPhoto);
      const options = await ApiClient.getOptions({
        'Content-Type': 'multipart/form-data',
      });
      await axios.post(
        `${VITE_API_URL}/real-estate/property/${propertyId}/photo`,
        formData,
        options
      );
    } catch {
      showToast({ message: t('property:photoUploadError'), severity: "error" });
    }
  }

  // Create charges for new properties only
  if (!idParam && propertyId) {
    const chargeInputs: PropertyChargeInput[] = [];
    const startDate = data.purchaseDate
      ? dayjs(data.purchaseDate).format('YYYY-MM-DD')
      : null;

    if (charges.maintenanceFee > 0) {
      chargeInputs.push({
        propertyId,
        chargeType: ChargeType.MAINTENANCE_FEE,
        amount: charges.maintenanceFee,
        startDate,
      });
    }
    if (charges.financialCharge > 0) {
      chargeInputs.push({
        propertyId,
        chargeType: ChargeType.FINANCIAL_CHARGE,
        amount: charges.financialCharge,
        startDate,
      });
    }
    if (charges.waterCharge > 0) {
      chargeInputs.push({
        propertyId,
        chargeType: ChargeType.WATER_PREPAYMENT,
        amount: charges.waterCharge,
        startDate,
      });
    }

    if (chargeInputs.length > 0) {
      try {
        await ApiClient.request({
          method: 'POST',
          url: `/real-estate/property/${propertyId}/charges/batch`,
          data: chargeInputs,
        });
      } catch {
        showToast({ message: t('property:report.fetchError'), severity: "error" });
      }
    }
  }
};
```

- [ ] **Step 5: Update the Monthly Costs section in renderFormContent**

For edit mode, show readonly fields with manage button:

```typescript
{/* Monthly Costs Section */}
<Divider sx={{ my: 1 }} />
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
    {t('monthlyCostsSection')}
  </Typography>
  {isEditMode && (
    <AssetButton
      label={t('manageCharges')}
      variant="text"
      size="small"
      onClick={() => setChargeDialogOpen(true)}
    />
  )}
</Box>

{isEditMode ? (
  // Edit mode: readonly display
  <Stack direction="row" spacing={2}>
    <Box sx={{ flex: 1 }}>
      <AssetMoneyField
        label={t('maintenanceFee')}
        value={charges.maintenanceFee}
        disabled
      />
    </Box>
    <Box sx={{ flex: 1 }}>
      <AssetMoneyField
        label={t('financialCharge')}
        value={charges.financialCharge}
        disabled
      />
    </Box>
    <Box sx={{ flex: 1 }}>
      <AssetMoneyField
        label={t('totalCharge')}
        value={charges.totalCharge}
        disabled
      />
    </Box>
  </Stack>
) : (
  // Add mode: editable fields
  <>
    <Stack direction="row" spacing={2}>
      <Box sx={{ flex: 1 }}>
        <AssetMoneyField
          label={t('maintenanceFee')}
          value={charges.maintenanceFee}
          onChange={(value) => handleChargeChange('maintenanceFee', value)}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <AssetMoneyField
          label={t('financialCharge')}
          value={charges.financialCharge}
          onChange={(value) => handleChargeChange('financialCharge', value)}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <AssetMoneyField
          label={t('totalCharge')}
          value={charges.totalCharge}
          onChange={(value) => handleChargeChange('totalCharge', value)}
        />
      </Box>
    </Stack>
    <Stack direction="row" spacing={2}>
      <Box sx={{ flex: 1 }}>
        <AssetMoneyField
          label={t('waterCharge')}
          value={charges.waterCharge}
          onChange={(value) => handleChargeChange('waterCharge', value ?? 0)}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <AssetMoneyField
          label={data.status === PropertyStatus.PROSPECT ? t('expectedRent') : t('monthlyRent')}
          value={data.monthlyRent ?? 0}
          onChange={(value) => handleChange('monthlyRent', value)}
        />
      </Box>
    </Stack>
  </>
)}
```

- [ ] **Step 6: Add PropertyChargeDialog at the end of the component**

```typescript
{isEditMode && (
  <PropertyChargeDialog
    open={chargeDialogOpen}
    propertyId={Number(idParam)}
    onClose={() => setChargeDialogOpen(false)}
    onChargesUpdated={() => {
      // Refetch charges
      ApiClient.request<CurrentCharges>({
        method: 'GET',
        url: `/real-estate/property/${idParam}/charges/current`,
      }).then((result) => {
        setCharges({
          maintenanceFee: result.maintenanceFee ?? 0,
          financialCharge: result.financialCharge ?? 0,
          waterCharge: result.waterPrepayment ?? 0,
          totalCharge: result.totalCharge ?? 0,
        });
      });
    }}
  />
)}
```

- [ ] **Step 7: Add necessary imports**

```typescript
import PropertyChargeDialog from './sections/PropertyChargeDialog';
import { CurrentCharges, ChargeType, PropertyChargeInput } from '@asset-types';
import dayjs from 'dayjs';
```

- [ ] **Step 8: Update tests**

Update PropertyForm tests to mock charge API calls.

- [ ] **Step 9: Run tests**

```bash
cd frontend && npm test -- --testPathPattern="PropertyForm"
```

Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add frontend/src/components/property/PropertyForm.tsx frontend/src/components/property/PropertyForm.test.tsx
git commit -m "feat: update PropertyForm to use separate charge state and batch API"
```

---

## Task 13: Fix Remaining Test Failures

**Files:**
- Various test files that reference old charge fields

- [ ] **Step 1: Find and update all test files referencing old fields**

```bash
cd backend && grep -r "maintenanceFee\|financialCharge\|waterCharge" test/ --include="*.spec.ts" --include="*.e2e-spec.ts"
cd frontend && grep -r "maintenanceFee\|financialCharge\|waterCharge" test/ src/ --include="*.test.tsx" --include="*.test.ts"
```

- [ ] **Step 2: Update test factories**

In `backend/test/factories/property.factory.ts`, remove charge fields from default property creation.

- [ ] **Step 3: Update frontend test mocks**

In any test that creates mock Property objects, remove charge fields.

- [ ] **Step 4: Run all tests**

```bash
cd backend && npm test && npm run test:e2e
cd frontend && npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: update tests for removed charge fields"
```

---

## Task 14: Run Full Test Suite and Verify

- [ ] **Step 1: Run backend tests**

```bash
cd backend && npm test
```

Expected: All tests pass

- [ ] **Step 2: Run backend e2e tests**

```bash
cd backend && npm run test:e2e
```

Expected: All tests pass

- [ ] **Step 3: Run frontend tests**

```bash
cd frontend && npm test
```

Expected: All tests pass

- [ ] **Step 4: Run linting**

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

Expected: No errors

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve final test and lint issues"
```

---

## Summary

This plan implements:
1. Database migration to make startDate nullable and remove old charge columns
2. Backend createBatch endpoint for efficient charge creation
3. Import service updates to use charge API
4. Frontend PropertyInfoSection fetches charges from API with history button
5. Frontend PropertyForm uses separate charge state with batch save for new properties
6. All related tests updated
