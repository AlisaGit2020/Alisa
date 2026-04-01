# Property Charges Season-Based UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign property charges UI to enter/display all charge types per season (shared date range) instead of one-at-a-time entry grouped by type.

**Architecture:** Add new ChargeType (OTHER_CHARGE_BASED) and ExpenseType. Rewrite frontend dialog/form components with season-card based UI. Backend changes minimal — just add new type to enum and total calculation.

**Tech Stack:** NestJS, TypeORM, React, Material-UI, i18next

---

## File Structure

### Backend Files
- `backend/src/common/types.ts` — Add OTHER_CHARGE_BASED to ChargeType enum and ExpenseTypeKey
- `backend/src/real-estate/property/property-charge.service.ts` — Update recalculateTotalCharge() to include new type
- `backend/src/real-estate/property/dtos/property-charge-response.dto.ts` — Add otherChargeBased to CurrentChargesDto
- `backend/src/migrations/1775100000001-AddOtherChargeBasedTypes.ts` — Migration for new expense type

### Frontend Files
- `frontend/src/types/common.ts` — Add OTHER_CHARGE_BASED to ChargeType enum
- `frontend/src/components/property/sections/SeasonCard.tsx` — NEW: Season card display component
- `frontend/src/components/property/sections/SeasonChargeForm.tsx` — NEW: Season entry form (replaces PropertyChargeForm)
- `frontend/src/components/property/sections/PropertyChargeDialog.tsx` — Rewrite with season-based UI
- `frontend/src/translations/property/{en,fi,sv}.ts` — Add translations for new charge type and UI strings
- `frontend/src/translations/expense-type/{en,fi,sv}.ts` — Add other-charge-based expense type translation

### Test Files
- `backend/src/real-estate/property/property-charge.service.spec.ts` — Test new type in total calculation
- `frontend/src/components/property/sections/SeasonCard.test.tsx` — NEW
- `frontend/src/components/property/sections/SeasonChargeForm.test.tsx` — NEW
- `frontend/src/components/property/sections/PropertyChargeDialog.test.tsx` — Update for new UI

---

## Task 1: Add OTHER_CHARGE_BASED to Backend Types

**Files:**
- Modify: `backend/src/common/types.ts:208-220`

- [ ] **Step 1: Add OTHER_CHARGE_BASED to ChargeType enum**

```typescript
// Property charge types (seasonal charges with date ranges)
export enum ChargeType {
  MAINTENANCE_FEE = 1,    // Hoitovastike
  FINANCIAL_CHARGE = 2,   // Rahoitusvastike
  WATER_PREPAYMENT = 3,   // Vesi-ennakko
  TOTAL_CHARGE = 4,       // Yhtiövastike (calculated)
  OTHER_CHARGE_BASED = 5, // Muut vastikeperusteiset maksut
}

export const chargeTypeNames = new Map<ChargeType, string>([
  [ChargeType.MAINTENANCE_FEE, 'maintenance-fee'],
  [ChargeType.FINANCIAL_CHARGE, 'financial-charge'],
  [ChargeType.WATER_PREPAYMENT, 'water-prepayment'],
  [ChargeType.TOTAL_CHARGE, 'total-charge'],
  [ChargeType.OTHER_CHARGE_BASED, 'other-charge-based'],
]);
```

- [ ] **Step 2: Add OTHER_CHARGE_BASED to ExpenseTypeKey enum**

In the same file, add to the ExpenseTypeKey enum (around line 135-157):

```typescript
export enum ExpenseTypeKey {
  HOUSING_CHARGE = 'housing-charge',
  MAINTENANCE_CHARGE = 'maintenance-charge',
  FINANCIAL_CHARGE = 'financial-charge',
  REPAIRS = 'repairs',
  CAPITAL_IMPROVEMENT = 'capital-improvement',
  INSURANCE = 'insurance',
  PROPERTY_TAX = 'property-tax',
  WATER = 'water',
  ELECTRICITY = 'electricity',
  RENTAL_BROKERAGE = 'rental-brokerage',
  LOAN_INTEREST = 'loan-interest',
  LOAN_PRINCIPAL = 'loan-principal',
  LOAN_HANDLING_FEE = 'loan-handling-fee',
  LOAN_PAYMENT = 'loan-payment',
  CLEANING = 'cleaning',
  FURNISHINGS = 'furnishings',
  CONSUMABLES = 'consumables',
  RENTAL_OPERATIONS = 'rental-operations',
  RENT_REFUND = 'rent-refund',
  INTERNET = 'internet',
  WITHHOLDING_TAX = 'withholding-tax',
  OTHER_CHARGE_BASED = 'other-charge-based',
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd backend && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add backend/src/common/types.ts
git commit -m "$(cat <<'EOF'
feat: add OTHER_CHARGE_BASED to ChargeType and ExpenseTypeKey enums

New charge type for "Muut vastikeperusteiset maksut" (Other charge-based payments)
EOF
)"
```

---

## Task 2: Update Backend Total Charge Calculation

**Files:**
- Modify: `backend/src/real-estate/property/property-charge.service.ts:277-294`
- Test: `backend/src/real-estate/property/property-charge.service.spec.ts`

- [ ] **Step 1: Write failing test for OTHER_CHARGE_BASED in total calculation**

Add to `property-charge.service.spec.ts` in the `describe('create')` block after the existing recalculate test:

```typescript
it('should include OTHER_CHARGE_BASED in total calculation', async () => {
  const existingCharges = [
    createMockCharge(1, ChargeType.MAINTENANCE_FEE, 100, lastMonth, null),
    createMockCharge(2, ChargeType.FINANCIAL_CHARGE, 50, lastMonth, null),
    createMockCharge(3, ChargeType.WATER_PREPAYMENT, 20, lastMonth, null),
    createMockCharge(5, ChargeType.OTHER_CHARGE_BASED, 30, lastMonth, null),
  ];

  const input = {
    propertyId: 1,
    chargeType: ChargeType.MAINTENANCE_FEE,
    amount: 110,
    startDate: todayStr,
    endDate: null,
  };

  mockRepository.find.mockResolvedValue([]);
  // Mock getMany to return all charges including OTHER_CHARGE_BASED
  mockQueryBuilder.getMany!.mockResolvedValue([
    createMockCharge(1, ChargeType.MAINTENANCE_FEE, 110, today, null),
    createMockCharge(2, ChargeType.FINANCIAL_CHARGE, 50, lastMonth, null),
    createMockCharge(3, ChargeType.WATER_PREPAYMENT, 20, lastMonth, null),
    createMockCharge(5, ChargeType.OTHER_CHARGE_BASED, 30, lastMonth, null),
  ]);
  const newCharge = createMockCharge(1, ChargeType.MAINTENANCE_FEE, 110, today, null);
  const totalCharge = createMockCharge(6, ChargeType.TOTAL_CHARGE, 210, today, null);
  mockRepository.save.mockResolvedValue(newCharge);
  mockRepository.create.mockImplementation((data: Partial<PropertyCharge>) => {
    if (data.chargeType === ChargeType.TOTAL_CHARGE) {
      return totalCharge;
    }
    return newCharge;
  });
  mockRepository.findOne.mockResolvedValue(null);

  await service.create(mockUser, input);

  // Verify TOTAL_CHARGE includes OTHER_CHARGE_BASED: 110 + 50 + 20 + 30 = 210
  expect(mockRepository.save).toHaveBeenCalledWith(
    expect.objectContaining({
      chargeType: ChargeType.TOTAL_CHARGE,
      amount: 210,
    }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --testPathPattern=property-charge.service.spec.ts -t "should include OTHER_CHARGE_BASED"`
Expected: FAIL — current implementation doesn't include OTHER_CHARGE_BASED in types array

- [ ] **Step 3: Update recalculateTotalCharge to include OTHER_CHARGE_BASED**

In `property-charge.service.ts`, update the `recalculateTotalCharge` method (around line 285-290):

```typescript
private async recalculateTotalCharge(
  propertyId: number,
  asOfDate: Date,
): Promise<void> {
  // Get current component charges as of the given date
  const charges = await this.repository
    .createQueryBuilder('charge')
    .where('charge.propertyId = :propertyId', { propertyId })
    .andWhere('charge.chargeType IN (:...types)', {
      types: [
        ChargeType.MAINTENANCE_FEE,
        ChargeType.FINANCIAL_CHARGE,
        ChargeType.WATER_PREPAYMENT,
        ChargeType.OTHER_CHARGE_BASED,
      ],
    })
    .andWhere('charge.startDate <= :date', { date: asOfDate })
    .andWhere('(charge.endDate IS NULL OR charge.endDate >= :date)', { date: asOfDate })
    .getMany();

  // ... rest unchanged
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --testPathPattern=property-charge.service.spec.ts -t "should include OTHER_CHARGE_BASED"`
Expected: PASS

- [ ] **Step 5: Run all property-charge tests**

Run: `cd backend && npm test -- --testPathPattern=property-charge.service.spec.ts`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/src/real-estate/property/property-charge.service.ts backend/src/real-estate/property/property-charge.service.spec.ts
git commit -m "$(cat <<'EOF'
feat: include OTHER_CHARGE_BASED in total charge calculation

Total charge now sums maintenance + financial + water + other charge-based
EOF
)"
```

---

## Task 3: Update CurrentChargesDto for New Type

**Files:**
- Modify: `backend/src/real-estate/property/dtos/property-charge-response.dto.ts`
- Modify: `backend/src/real-estate/property/property-charge.service.ts:50-76`

- [ ] **Step 1: Add otherChargeBased to CurrentChargesDto**

Read the file first, then add the new field:

```typescript
export class CurrentChargesDto {
  maintenanceFee: number | null;
  financialCharge: number | null;
  waterPrepayment: number | null;
  totalCharge: number | null;
  otherChargeBased: number | null;
}
```

- [ ] **Step 2: Update getCurrentCharges to map OTHER_CHARGE_BASED**

In `property-charge.service.ts`, update the `getCurrentCharges` method:

```typescript
async getCurrentCharges(user: JWTUser, propertyId: number): Promise<CurrentChargesDto> {
  const property = await this.propertyService.findOne(user, propertyId);
  if (!property) {
    throw new NotFoundException('Property not found');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const charges = await this.repository
    .createQueryBuilder('charge')
    .where('charge.propertyId = :propertyId', { propertyId })
    .andWhere('(charge.startDate IS NULL OR charge.startDate <= :today)', { today })
    .andWhere('(charge.endDate IS NULL OR charge.endDate >= :today)', { today })
    .getMany();

  const result: CurrentChargesDto = {
    maintenanceFee: null,
    financialCharge: null,
    waterPrepayment: null,
    totalCharge: null,
    otherChargeBased: null,
  };

  for (const charge of charges) {
    switch (charge.chargeType) {
      case ChargeType.MAINTENANCE_FEE:
        result.maintenanceFee = charge.amount;
        break;
      case ChargeType.FINANCIAL_CHARGE:
        result.financialCharge = charge.amount;
        break;
      case ChargeType.WATER_PREPAYMENT:
        result.waterPrepayment = charge.amount;
        break;
      case ChargeType.TOTAL_CHARGE:
        result.totalCharge = charge.amount;
        break;
      case ChargeType.OTHER_CHARGE_BASED:
        result.otherChargeBased = charge.amount;
        break;
    }
  }

  return result;
}
```

- [ ] **Step 3: Verify build passes**

Run: `cd backend && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add backend/src/real-estate/property/dtos/property-charge-response.dto.ts backend/src/real-estate/property/property-charge.service.ts
git commit -m "$(cat <<'EOF'
feat: add otherChargeBased to CurrentChargesDto
EOF
)"
```

---

## Task 4: Create Migration for New Expense Type

**Files:**
- Create: `backend/src/migrations/1775100000001-AddOtherChargeBasedExpenseType.ts`

- [ ] **Step 1: Create migration file**

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOtherChargeBasedExpenseType1775100000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Adding other-charge-based expense type...');

    await queryRunner.query(`
      INSERT INTO expense_type (key, "isTaxDeductible", "isCapitalImprovement")
      VALUES ('other-charge-based', true, false)
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('Migration completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM expense_type WHERE key = 'other-charge-based'
    `);
  }
}
```

- [ ] **Step 2: Verify migration compiles**

Run: `cd backend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add backend/src/migrations/1775100000001-AddOtherChargeBasedExpenseType.ts
git commit -m "$(cat <<'EOF'
feat: add migration for other-charge-based expense type

Tax-deductible expense type for "Muut vastikeperusteiset maksut"
EOF
)"
```

---

## Task 5: Add Frontend ChargeType Enum Update

**Files:**
- Modify: `frontend/src/types/common.ts:229-241`

- [ ] **Step 1: Add OTHER_CHARGE_BASED to ChargeType enum**

```typescript
// Property charge types (seasonal charges with date ranges)
export enum ChargeType {
  MAINTENANCE_FEE = 1,    // Hoitovastike
  FINANCIAL_CHARGE = 2,   // Rahoitusvastike
  WATER_PREPAYMENT = 3,   // Vesi-ennakko
  TOTAL_CHARGE = 4,       // Yhtiövastike (calculated)
  OTHER_CHARGE_BASED = 5, // Muut vastikeperusteiset maksut
}

export const chargeTypeNames = new Map<ChargeType, string>([
  [ChargeType.MAINTENANCE_FEE, 'maintenance-fee'],
  [ChargeType.FINANCIAL_CHARGE, 'financial-charge'],
  [ChargeType.WATER_PREPAYMENT, 'water-prepayment'],
  [ChargeType.TOTAL_CHARGE, 'total-charge'],
  [ChargeType.OTHER_CHARGE_BASED, 'other-charge-based'],
]);
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npm run build`
Expected: Build succeeds (may have warnings, no errors)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/common.ts
git commit -m "$(cat <<'EOF'
feat: add OTHER_CHARGE_BASED to frontend ChargeType enum
EOF
)"
```

---

## Task 6: Add Translations for New Charge Type

**Files:**
- Modify: `frontend/src/translations/property/fi.ts`
- Modify: `frontend/src/translations/property/en.ts`
- Modify: `frontend/src/translations/property/sv.ts`
- Modify: `frontend/src/translations/expense-type/fi.ts`
- Modify: `frontend/src/translations/expense-type/en.ts`
- Modify: `frontend/src/translations/expense-type/sv.ts`

- [ ] **Step 1: Add charge type translations to property namespace**

**fi.ts** (add to chargeTypes object around line 92-97):
```typescript
chargeTypes: {
    'maintenance-fee': 'Hoitovastike',
    'financial-charge': 'Rahoitusvastike',
    'water-prepayment': 'Vesi-ennakko',
    'total-charge': 'Yhtiövastike',
    'other-charge-based': 'Muut vastikkeet',
},
```

**en.ts**:
```typescript
chargeTypes: {
    'maintenance-fee': 'Maintenance Fee',
    'financial-charge': 'Financial Charge',
    'water-prepayment': 'Water Prepayment',
    'total-charge': 'Total Charge',
    'other-charge-based': 'Other Charges',
},
```

**sv.ts**:
```typescript
chargeTypes: {
    'maintenance-fee': 'Underhållsavgift',
    'financial-charge': 'Finansieringsavgift',
    'water-prepayment': 'Vattenförskott',
    'total-charge': 'Total avgift',
    'other-charge-based': 'Övriga avgifter',
},
```

- [ ] **Step 2: Add new UI strings for season-based dialog**

Add to all three property translation files (after the chargeTypes section):

**fi.ts**:
```typescript
// Season-based UI
newSeason: 'Uusi kausi',
currentSeason: 'Voimassa oleva kausi',
addNewSeason: 'Lisää uusi kausi',
seasonFrom: 'Kausi alkaen',
history: 'Historia',
showAll: 'Näytä kaikki',
perMonth: '/kk',
total: 'Yhteensä',
ongoing: 'Toistaiseksi',
```

**en.ts**:
```typescript
// Season-based UI
newSeason: 'New Season',
currentSeason: 'Current Season',
addNewSeason: 'Add New Season',
seasonFrom: 'Season from',
history: 'History',
showAll: 'Show all',
perMonth: '/mo',
total: 'Total',
ongoing: 'Ongoing',
```

**sv.ts**:
```typescript
// Season-based UI
newSeason: 'Ny period',
currentSeason: 'Aktuell period',
addNewSeason: 'Lägg till ny period',
seasonFrom: 'Period från',
history: 'Historik',
showAll: 'Visa alla',
perMonth: '/mån',
total: 'Totalt',
ongoing: 'Tillsvidare',
```

- [ ] **Step 3: Add expense type translations**

**expense-type/fi.ts** (add to the object):
```typescript
'other-charge-based': 'Muut vastikeperusteiset maksut',
```

**expense-type/en.ts**:
```typescript
'other-charge-based': 'Other charge-based payments',
```

**expense-type/sv.ts**:
```typescript
'other-charge-based': 'Övriga avgiftsbaserade betalningar',
```

- [ ] **Step 4: Verify build passes**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/src/translations/
git commit -m "$(cat <<'EOF'
feat: add translations for other-charge-based type and season UI strings
EOF
)"
```

---

## Task 7: Create SeasonCard Component

**Files:**
- Create: `frontend/src/components/property/sections/SeasonCard.tsx`
- Create: `frontend/src/components/property/sections/SeasonCard.test.tsx`

- [ ] **Step 1: Write failing test for SeasonCard**

```typescript
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@test-utils/test-wrapper';
import SeasonCard from './SeasonCard';
import { ChargeType, PropertyCharge } from '@asset-types';

describe('SeasonCard', () => {
  const mockCharges: PropertyCharge[] = [
    { id: 1, propertyId: 1, chargeType: ChargeType.MAINTENANCE_FEE, typeName: 'maintenance-fee', amount: 150, startDate: '2024-04-01', endDate: null },
    { id: 2, propertyId: 1, chargeType: ChargeType.FINANCIAL_CHARGE, typeName: 'financial-charge', amount: 85, startDate: '2024-04-01', endDate: null },
    { id: 3, propertyId: 1, chargeType: ChargeType.WATER_PREPAYMENT, typeName: 'water-prepayment', amount: 25, startDate: '2024-04-01', endDate: null },
    { id: 4, propertyId: 1, chargeType: ChargeType.OTHER_CHARGE_BASED, typeName: 'other-charge-based', amount: 15, startDate: '2024-04-01', endDate: null },
    { id: 5, propertyId: 1, chargeType: ChargeType.TOTAL_CHARGE, typeName: 'total-charge', amount: 275, startDate: '2024-04-01', endDate: null },
  ];

  it('renders all charge amounts', () => {
    renderWithProviders(
      <SeasonCard
        charges={mockCharges}
        startDate="2024-04-01"
        endDate={null}
        isActive={true}
        onEdit={jest.fn()}
      />
    );

    expect(screen.getByText('€150')).toBeInTheDocument();
    expect(screen.getByText('€85')).toBeInTheDocument();
    expect(screen.getByText('€25')).toBeInTheDocument();
    expect(screen.getByText('€15')).toBeInTheDocument();
    expect(screen.getByText('€275')).toBeInTheDocument();
  });

  it('shows edit button for active season', async () => {
    const onEdit = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <SeasonCard
        charges={mockCharges}
        startDate="2024-04-01"
        endDate={null}
        isActive={true}
        onEdit={onEdit}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalled();
  });

  it('does not show edit button for inactive season', () => {
    renderWithProviders(
      <SeasonCard
        charges={mockCharges}
        startDate="2023-01-01"
        endDate="2024-03-31"
        isActive={false}
        onEdit={jest.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern=SeasonCard.test.tsx`
Expected: FAIL — component doesn't exist

- [ ] **Step 3: Implement SeasonCard component**

```typescript
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useTranslation } from 'react-i18next';
import { ChargeType, PropertyCharge } from '@asset-types';

interface SeasonCardProps {
  charges: PropertyCharge[];
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  onEdit?: () => void;
}

const CHARGE_TYPE_ORDER = [
  ChargeType.MAINTENANCE_FEE,
  ChargeType.FINANCIAL_CHARGE,
  ChargeType.WATER_PREPAYMENT,
  ChargeType.OTHER_CHARGE_BASED,
];

function SeasonCard({ charges, startDate, endDate, isActive, onEdit }: SeasonCardProps) {
  const { t } = useTranslation('property');

  const getChargeAmount = (chargeType: ChargeType): number => {
    const charge = charges.find(c => c.chargeType === chargeType);
    return charge?.amount ?? 0;
  };

  const totalCharge = charges.find(c => c.chargeType === ChargeType.TOTAL_CHARGE);
  const total = totalCharge?.amount ?? 0;

  const formatDate = (date: string) => {
    return t('format.date', {
      val: new Date(date),
      formatParams: { val: { year: 'numeric', month: 'numeric', day: 'numeric' } },
    });
  };

  return (
    <Box
      sx={{
        p: 2,
        border: 1,
        borderColor: isActive ? 'primary.main' : 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        opacity: isActive ? 1 : 0.7,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box>
          {isActive && (
            <Typography variant="caption" color="text.secondary">
              {t('currentSeason')}
            </Typography>
          )}
          <Typography variant="subtitle2" fontWeight={600}>
            {formatDate(startDate)} → {endDate ? formatDate(endDate) : t('ongoing')}
          </Typography>
        </Box>
        {isActive && onEdit && (
          <Tooltip title={t('editCharge')}>
            <IconButton size="small" onClick={onEdit} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Charge cards grid */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        {CHARGE_TYPE_ORDER.map(chargeType => {
          const amount = getChargeAmount(chargeType);
          const typeName = charges.find(c => c.chargeType === chargeType)?.typeName;
          if (amount === 0 && !isActive) return null;

          return (
            <Box
              key={chargeType}
              sx={{
                flex: '1 1 0',
                minWidth: 70,
                textAlign: 'center',
                py: 1,
                px: 0.5,
                bgcolor: 'grey.100',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {t(`chargeTypes.${typeName || 'maintenance-fee'}`).split(' ')[0]}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                €{amount}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Total */}
      <Box
        sx={{
          textAlign: 'center',
          py: 1.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 1,
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          {t('total')}
        </Typography>
        <Typography variant="h6" fontWeight={700} component="span" sx={{ ml: 1 }}>
          €{total}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9, ml: 0.5 }}>
          {t('perMonth')}
        </Typography>
      </Box>
    </Box>
  );
}

export default SeasonCard;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPattern=SeasonCard.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/property/sections/SeasonCard.tsx frontend/src/components/property/sections/SeasonCard.test.tsx
git commit -m "$(cat <<'EOF'
feat: add SeasonCard component for displaying charge seasons

Displays all charge types in a visual grid with total prominently shown
EOF
)"
```

---

## Task 8: Create SeasonChargeForm Component

**Files:**
- Create: `frontend/src/components/property/sections/SeasonChargeForm.tsx`
- Create: `frontend/src/components/property/sections/SeasonChargeForm.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@test-utils/test-wrapper';
import SeasonChargeForm from './SeasonChargeForm';
import { ChargeType, PropertyCharge } from '@asset-types';

describe('SeasonChargeForm', () => {
  const defaultProps = {
    propertyId: 1,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all charge type inputs', () => {
    renderWithProviders(<SeasonChargeForm {...defaultProps} />);

    // Should have 4 amount inputs (maintenance, financial, water, other) + dates
    expect(screen.getByLabelText(/maintenance/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/financial/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/water/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/other/i)).toBeInTheDocument();
  });

  it('auto-calculates total', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SeasonChargeForm {...defaultProps} />);

    const maintenanceInput = screen.getByLabelText(/maintenance/i);
    const financialInput = screen.getByLabelText(/financial/i);

    await user.clear(maintenanceInput);
    await user.type(maintenanceInput, '150');
    await user.clear(financialInput);
    await user.type(financialInput, '50');

    // Total should show 200
    await waitFor(() => {
      expect(screen.getByText(/€\s*200/)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with all charge inputs', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    renderWithProviders(<SeasonChargeForm {...defaultProps} onSubmit={onSubmit} />);

    const maintenanceInput = screen.getByLabelText(/maintenance/i);
    await user.clear(maintenanceInput);
    await user.type(maintenanceInput, '150');

    // Click save
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('requires start date', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SeasonChargeForm {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern=SeasonChargeForm.test.tsx`
Expected: FAIL — component doesn't exist

- [ ] **Step 3: Implement SeasonChargeForm component**

```typescript
import { Box, Stack, Typography } from '@mui/material';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChargeType, PropertyChargeInput } from '@asset-types';
import AssetButton from '../../asset/form/AssetButton';
import AssetMoneyField from '../../asset/form/AssetMoneyField';
import AssetDatePicker from '../../asset/form/AssetDatePicker';
import dayjs from 'dayjs';

interface SeasonChargeFormProps {
  propertyId: number;
  initialValues?: {
    maintenanceFee?: number;
    financialCharge?: number;
    waterPrepayment?: number;
    otherChargeBased?: number;
    startDate?: string;
    endDate?: string | null;
  };
  onSubmit: (inputs: PropertyChargeInput[]) => void;
  onCancel: () => void;
}

function SeasonChargeForm({ propertyId, initialValues, onSubmit, onCancel }: SeasonChargeFormProps) {
  const { t } = useTranslation('property');

  const [maintenanceFee, setMaintenanceFee] = useState(initialValues?.maintenanceFee ?? 0);
  const [financialCharge, setFinancialCharge] = useState(initialValues?.financialCharge ?? 0);
  const [waterPrepayment, setWaterPrepayment] = useState(initialValues?.waterPrepayment ?? 0);
  const [otherChargeBased, setOtherChargeBased] = useState(initialValues?.otherChargeBased ?? 0);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(
    initialValues?.startDate ? dayjs(initialValues.startDate) : null
  );
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(
    initialValues?.endDate ? dayjs(initialValues.endDate) : null
  );
  const [errors, setErrors] = useState<{ startDate?: string }>({});

  const total = useMemo(() => {
    return maintenanceFee + financialCharge + waterPrepayment + otherChargeBased;
  }, [maintenanceFee, financialCharge, waterPrepayment, otherChargeBased]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!startDate) {
      newErrors.startDate = t('startDateRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const inputs: PropertyChargeInput[] = [];
    const dateStr = startDate!.format('YYYY-MM-DD');
    const endDateStr = endDate ? endDate.format('YYYY-MM-DD') : null;

    if (maintenanceFee > 0) {
      inputs.push({ propertyId, chargeType: ChargeType.MAINTENANCE_FEE, amount: maintenanceFee, startDate: dateStr, endDate: endDateStr });
    }
    if (financialCharge > 0) {
      inputs.push({ propertyId, chargeType: ChargeType.FINANCIAL_CHARGE, amount: financialCharge, startDate: dateStr, endDate: endDateStr });
    }
    if (waterPrepayment > 0) {
      inputs.push({ propertyId, chargeType: ChargeType.WATER_PREPAYMENT, amount: waterPrepayment, startDate: dateStr, endDate: endDateStr });
    }
    if (otherChargeBased > 0) {
      inputs.push({ propertyId, chargeType: ChargeType.OTHER_CHARGE_BASED, amount: otherChargeBased, startDate: dateStr, endDate: endDateStr });
    }

    onSubmit(inputs);
  };

  const chargeFields = [
    { label: t('chargeTypes.maintenance-fee'), value: maintenanceFee, onChange: setMaintenanceFee, ariaLabel: 'Maintenance' },
    { label: t('chargeTypes.financial-charge'), value: financialCharge, onChange: setFinancialCharge, ariaLabel: 'Financial' },
    { label: t('chargeTypes.water-prepayment'), value: waterPrepayment, onChange: setWaterPrepayment, ariaLabel: 'Water' },
    { label: t('chargeTypes.other-charge-based'), value: otherChargeBased, onChange: setOtherChargeBased, ariaLabel: 'Other' },
  ];

  return (
    <Box component="form" role="form">
      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
        {t('newSeason')}
      </Typography>

      {/* Date pickers */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <AssetDatePicker
          label={t('startDate')}
          value={startDate}
          onChange={setStartDate}
          error={!!errors.startDate}
          helperText={errors.startDate}
        />
        <AssetDatePicker
          label={t('endDate')}
          value={endDate}
          onChange={setEndDate}
          helperText={t('leaveEmptyForValidUntilFurtherNotice')}
        />
      </Stack>

      {/* Charge inputs as card row */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {chargeFields.map(field => (
          <Box
            key={field.ariaLabel}
            sx={{
              flex: '1 1 0',
              minWidth: 100,
              textAlign: 'center',
              p: 1.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, display: 'block', mb: 1 }}>
              {field.label}
            </Typography>
            <AssetMoneyField
              value={field.value}
              onChange={(v) => field.onChange(v ?? 0)}
              aria-label={field.ariaLabel}
              size="small"
              sx={{
                '& input': { textAlign: 'center', fontWeight: 600, fontSize: 18 },
                '& .MuiInputAdornment-root': { display: 'none' },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              €{t('perMonth')}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Total display */}
      <Box
        sx={{
          textAlign: 'center',
          py: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 2,
          mb: 3,
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          {t('total')}
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          € {total.toFixed(2)}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          {t('perMonth')}
        </Typography>
      </Box>

      {/* Actions */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <AssetButton label={t('cancel')} variant="outlined" onClick={onCancel} />
        <AssetButton label={t('save')} variant="contained" onClick={handleSubmit} />
      </Stack>
    </Box>
  );
}

export default SeasonChargeForm;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPattern=SeasonChargeForm.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/property/sections/SeasonChargeForm.tsx frontend/src/components/property/sections/SeasonChargeForm.test.tsx
git commit -m "$(cat <<'EOF'
feat: add SeasonChargeForm for entering all charges at once

Card-input-row layout with auto-calculating total
EOF
)"
```

---

## Task 9: Rewrite PropertyChargeDialog with Season-Based UI

**Files:**
- Modify: `frontend/src/components/property/sections/PropertyChargeDialog.tsx`
- Modify: `frontend/src/components/property/sections/PropertyChargeDialog.test.tsx`

- [ ] **Step 1: Update PropertyChargeDialog tests**

Replace the test file with season-based tests:

```typescript
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@test-utils/test-wrapper';
import PropertyChargeDialog from './PropertyChargeDialog';

// Mock API responses
jest.mock('@asset-lib/api-client', () => ({
  __esModule: true,
  default: {
    request: jest.fn(),
  },
}));

import ApiClient from '@asset-lib/api-client';

describe('PropertyChargeDialog', () => {
  const defaultProps = {
    open: true,
    propertyId: 1,
    onClose: jest.fn(),
    onChargesUpdated: jest.fn(),
  };

  const mockCharges = [
    { id: 1, propertyId: 1, chargeType: 1, typeName: 'maintenance-fee', amount: 150, startDate: '2024-04-01', endDate: null },
    { id: 2, propertyId: 1, chargeType: 2, typeName: 'financial-charge', amount: 85, startDate: '2024-04-01', endDate: null },
    { id: 3, propertyId: 1, chargeType: 4, typeName: 'total-charge', amount: 235, startDate: '2024-04-01', endDate: null },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (ApiClient.request as jest.Mock).mockResolvedValue(mockCharges);
  });

  it('renders dialog with current season card', async () => {
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('€150')).toBeInTheDocument();
      expect(screen.getByText('€235')).toBeInTheDocument();
    });
  });

  it('shows add new season button', async () => {
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new season/i })).toBeInTheDocument();
    });
  });

  it('opens form when add new season clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new season/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add new season/i }));

    expect(screen.getByText(/new season/i)).toBeInTheDocument();
  });

  it('closes dialog when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithProviders(<PropertyChargeDialog {...defaultProps} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --testPathPattern=PropertyChargeDialog.test.tsx`
Expected: FAIL — current implementation doesn't match new tests

- [ ] **Step 3: Rewrite PropertyChargeDialog**

```typescript
import { Alert, Box, CircularProgress, Divider, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChargeType, PropertyCharge, PropertyChargeInput } from '@asset-types';
import ApiClient from '@asset-lib/api-client';
import AssetDialog from '../../asset/dialog/AssetDialog';
import AssetButton from '../../asset/form/AssetButton';
import SeasonCard from './SeasonCard';
import SeasonChargeForm from './SeasonChargeForm';

interface PropertyChargeDialogProps {
  open: boolean;
  propertyId: number;
  onClose: () => void;
  onChargesUpdated?: () => void;
}

interface Season {
  startDate: string;
  endDate: string | null;
  charges: PropertyCharge[];
}

function PropertyChargeDialog({
  open,
  propertyId,
  onClose,
  onChargesUpdated,
}: PropertyChargeDialogProps) {
  const { t } = useTranslation('property');
  const [charges, setCharges] = useState<PropertyCharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const fetchCharges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.request<PropertyCharge[]>({
        method: 'GET',
        url: `/real-estate/property/${propertyId}/charges`,
      });
      setCharges(data);
    } catch {
      setError(t('report.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [propertyId, t]);

  useEffect(() => {
    if (open) {
      fetchCharges();
    }
  }, [open, fetchCharges]);

  // Group charges into seasons by startDate
  const seasons: Season[] = useMemo(() => {
    const seasonMap = new Map<string, PropertyCharge[]>();

    for (const charge of charges) {
      const key = charge.startDate || 'null';
      const existing = seasonMap.get(key) || [];
      existing.push(charge);
      seasonMap.set(key, existing);
    }

    return Array.from(seasonMap.entries())
      .map(([startDate, seasonCharges]) => ({
        startDate: startDate === 'null' ? '' : startDate,
        endDate: seasonCharges[0]?.endDate || null,
        charges: seasonCharges,
      }))
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
  }, [charges]);

  const currentSeason = seasons.find(s => !s.endDate);
  const historicSeasons = seasons.filter(s => s.endDate);

  const handleFormSubmit = async (inputs: PropertyChargeInput[]) => {
    try {
      await ApiClient.request({
        method: 'POST',
        url: `/real-estate/property/${propertyId}/charges/batch`,
        data: inputs,
      });
      setShowForm(false);
      await fetchCharges();
      onChargesUpdated?.();
    } catch {
      setError(t('report.fetchError'));
    }
  };

  if (!open) {
    return null;
  }

  return (
    <AssetDialog
      open={open}
      onClose={onClose}
      title={t('chargeHistory')}
      maxWidth="sm"
      fullWidth
      actions={
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', px: 2 }}>
          <AssetButton label={t('close')} variant="outlined" onClick={onClose} />
        </Box>
      }
    >
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress role="progressbar" />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ p: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && !showForm && (
        <>
          {/* Current season */}
          {currentSeason && (
            <Box sx={{ mb: 2 }}>
              <SeasonCard
                charges={currentSeason.charges}
                startDate={currentSeason.startDate}
                endDate={currentSeason.endDate}
                isActive={true}
                onEdit={() => setShowForm(true)}
              />
            </Box>
          )}

          {/* Add new season button */}
          <Box sx={{ mb: 2 }}>
            <AssetButton
              label={t('addNewSeason')}
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
              fullWidth
              sx={{
                borderStyle: 'dashed',
                py: 1.5,
              }}
            />
          </Box>

          {/* History section */}
          {historicSeasons.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="overline" color="text.secondary">
                  {t('history')}
                </Typography>
                {historicSeasons.length > 1 && (
                  <AssetButton
                    label={showAllHistory ? t('hideHistory') : t('showAll')}
                    variant="text"
                    size="small"
                    onClick={() => setShowAllHistory(prev => !prev)}
                  />
                )}
              </Box>
              {(showAllHistory ? historicSeasons : historicSeasons.slice(0, 1)).map((season, idx) => (
                <Box key={season.startDate || idx} sx={{ mb: 1 }}>
                  <SeasonCard
                    charges={season.charges}
                    startDate={season.startDate}
                    endDate={season.endDate}
                    isActive={false}
                  />
                </Box>
              ))}
            </>
          )}
        </>
      )}

      {showForm && (
        <SeasonChargeForm
          propertyId={propertyId}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </AssetDialog>
  );
}

export default PropertyChargeDialog;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPattern=PropertyChargeDialog.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Run all frontend tests**

Run: `cd frontend && npm test`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/property/sections/PropertyChargeDialog.tsx frontend/src/components/property/sections/PropertyChargeDialog.test.tsx
git commit -m "$(cat <<'EOF'
feat: rewrite PropertyChargeDialog with season-based UI

- Current season card at top
- Add new season button
- Collapsible history section
EOF
)"
```

---

## Task 10: Delete Old PropertyChargeForm

**Files:**
- Delete: `frontend/src/components/property/sections/PropertyChargeForm.tsx`
- Delete: `frontend/src/components/property/sections/PropertyChargeForm.test.tsx`

- [ ] **Step 1: Remove old files**

```bash
rm frontend/src/components/property/sections/PropertyChargeForm.tsx
rm frontend/src/components/property/sections/PropertyChargeForm.test.tsx
```

- [ ] **Step 2: Verify build passes**

Run: `cd frontend && npm run build`
Expected: Build succeeds (no imports of deleted file)

- [ ] **Step 3: Run all tests**

Run: `cd frontend && npm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: remove old PropertyChargeForm (replaced by SeasonChargeForm)
EOF
)"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run all backend tests**

Run: `cd backend && npm test`
Expected: All tests pass

- [ ] **Step 2: Run all frontend tests**

Run: `cd frontend && npm test`
Expected: All tests pass

- [ ] **Step 3: Run backend build**

Run: `cd backend && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 5: Manual testing checklist**

Start the dev servers and verify:
- [ ] Open property charges dialog — shows current season as card
- [ ] Click "Add new season" — shows form with all charge inputs
- [ ] Enter amounts — total auto-calculates
- [ ] Save — new season appears, previous season closed
- [ ] History shows below with collapsed view
- [ ] Theme colors work in both light and dark mode

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: verify property charges season UI implementation complete
EOF
)"
```
