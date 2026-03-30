# Tax Deductions Feature Design

## Context

Airbnb property owners in Finland can deduct certain expenses that aren't tracked as regular accounting expenses—specifically travel to the property and laundry costs. These deductions should affect only tax calculations, not the property's accounting/balance. This feature adds:

1. A new `TaxDeduction` entity separate from `Expense`
2. Property fields to mark Airbnb properties and store distance from home
3. Calculator dialogs for travel and laundry deductions
4. A generic custom deduction option for any property

## Requirements Summary

| Requirement | Decision |
|-------------|----------|
| Data model | New `TaxDeduction` entity (tax-only, no accounting impact) |
| Travel rate | Built-in Finnish rates per year, user can override |
| Travel calculation | Round trip: distance × 2 × visits × rate |
| Laundry price | Default 3€ with override |
| UI location | Tax reports page only, dropdown menu |
| Generic deductions | Yes, custom deductions for any property |

## Database Schema

### TaxDeduction Entity

```sql
CREATE TABLE tax_deduction (
  id SERIAL PRIMARY KEY,
  "propertyId" INTEGER NOT NULL REFERENCES property(id) ON DELETE CASCADE,
  year SMALLINT NOT NULL,
  "deductionType" SMALLINT NOT NULL,  -- 1=TRAVEL, 2=LAUNDRY, 3=CUSTOM
  description VARCHAR(255),
  amount DECIMAL(12,2) NOT NULL,
  metadata JSONB  -- stores calculation inputs
);

CREATE INDEX idx_tax_deduction_property_year ON tax_deduction("propertyId", year);
```

### Property Table Additions

```sql
ALTER TABLE property
ADD COLUMN "isAirbnb" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "distanceFromHome" DECIMAL(6,1) NULL;
```

### Types

```typescript
enum TaxDeductionType {
  TRAVEL = 1,
  LAUNDRY = 2,
  CUSTOM = 3,
}

interface TaxDeductionMetadata {
  distanceKm?: number;
  visits?: number;
  ratePerKm?: number;
  pricePerLaundry?: number;
}
```

## Travel Compensation Rates

Finnish tax authority rates stored in code:

```typescript
// backend/src/real-estate/property/travel-compensation-rates.ts
export const TRAVEL_COMPENSATION_RATES: Record<number, number> = {
  2024: 0.30,
  2025: 0.30,
  2026: 0.30,
};

export const DEFAULT_LAUNDRY_PRICE = 3.0;
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/real-estate/property/tax/deductions?year=&propertyId=` | List deductions |
| GET | `/api/real-estate/property/tax/deductions/calculate?propertyId=&year=` | Get calculation preview (visits, rates) |
| POST | `/api/real-estate/property/tax/deductions` | Create deduction |
| PUT | `/api/real-estate/property/tax/deductions/:id` | Update deduction |
| DELETE | `/api/real-estate/property/tax/deductions/:id` | Delete deduction |
| GET | `/api/real-estate/property/tax/rates?year=` | Get travel rates |

## Backend Components

### Files to Create

- `backend/src/real-estate/property/entities/tax-deduction.entity.ts`
- `backend/src/real-estate/property/tax-deduction.service.ts`
- `backend/src/real-estate/property/tax-deduction.controller.ts`
- `backend/src/real-estate/property/dtos/tax-deduction-input.dto.ts`
- `backend/src/real-estate/property/dtos/tax-deduction-response.dto.ts`
- `backend/src/real-estate/property/travel-compensation-rates.ts`
- `backend/src/migrations/TIMESTAMP-CreateTaxDeductionTable.ts`

### Files to Modify

- `backend/src/real-estate/property/entities/property.entity.ts` - Add `isAirbnb`, `distanceFromHome`
- `backend/src/real-estate/property/dtos/property-input.dto.ts` - Add new fields
- `backend/src/real-estate/property/tax.service.ts` - Include tax deductions in calculation
- `backend/src/real-estate/property/dtos/tax-response.dto.ts` - Add `taxDeductions`, `taxDeductionBreakdown`
- `backend/src/common/types.ts` - Add `TaxDeductionType` enum
- `backend/src/real-estate/real-estate.module.ts` - Register new service/controller

### TaxService Integration

Modify `calculate()` to:
1. Fetch `TaxDeduction` records for the property/year
2. Apply ownership share to each deduction
3. Add to total deductions
4. Include in response breakdown

## Frontend Components

### Files to Create

- `frontend/src/components/tax/TaxDeductionDialog.tsx` - Main dialog container
- `frontend/src/components/tax/TravelDeductionForm.tsx` - Travel calculator form
- `frontend/src/components/tax/LaundryDeductionForm.tsx` - Laundry calculator form
- `frontend/src/components/tax/CustomDeductionForm.tsx` - Manual entry form

### Files to Modify

- `frontend/src/types/inputs.ts` - Add `TaxDeductionInput` interface
- `frontend/src/types/entities.ts` - Add `TaxDeduction` interface
- `frontend/src/types/common.ts` - Add `TaxDeductionType` enum
- `frontend/src/components/property/PropertyForm.tsx` - Add Airbnb settings section
- `frontend/src/components/tax/TaxView.tsx` - Add dropdown button, dialog state
- `frontend/src/components/tax/TaxBreakdown.tsx` - Display tax deductions section
- `frontend/src/translations/*/tax.ts` - Add translation keys (en, fi, sv)
- `frontend/src/translations/*/property.ts` - Add Airbnb field translations

## UI Design

### Add Tax Deduction Button

Dropdown menu in TaxView header:
- "Travel Expenses" (Airbnb only)
- "Laundry Expenses" (Airbnb only)
- "Custom Deduction" (all properties)

### Travel Dialog

- Property name (read-only)
- Distance from home (editable, pre-filled from property)
- Visits in year (read-only, from AIRBNB_VISITS statistics)
- Compensation rate (editable, defaults to year's rate)
- Round trip distance (calculated: distance × 2)
- **Calculated total** (highlighted: distance × 2 × visits × rate)

### Laundry Dialog

- Property name (read-only)
- Visits in year (read-only, from statistics)
- Price per laundry (editable, default 3€)
- **Calculated total** (highlighted: visits × price)

### Custom Dialog

- Property name (read-only)
- Description (required, text input)
- Amount (required, money input)

### Tax Breakdown Display

New "Tax Deductions" section (orange header) between Expense Deductions and Depreciation, showing each deduction with calculation details.

## Testing

### Backend Unit Tests

- `tax-deduction.service.spec.ts`:
  - Creates travel/laundry/custom deductions correctly
  - Calculates amounts with correct rates
  - Gets visits from property statistics
  - Prevents unauthorized access

### Backend E2E Tests

- `tax-deduction.e2e-spec.ts`:
  - CRUD operations work
  - Tax calculation includes deductions
  - Ownership shares apply correctly

### Frontend Tests

- `TaxDeductionDialog.test.tsx`:
  - Renders correct form for each type
  - Calculates amounts correctly
  - Submits data correctly

## Implementation Phases

1. **Backend Foundation** - Types, entity, migration
2. **Backend Services** - TaxDeductionService, controller, DTOs
3. **Tax Integration** - Update TaxService.calculate()
4. **Frontend Property Form** - Add Airbnb settings
5. **Frontend Tax UI** - Dialogs, buttons, breakdown display
6. **Testing** - Unit and E2E tests

## Verification

1. Add Airbnb property with distance from home
2. Create some Airbnb income records (to generate visit statistics)
3. Go to Tax Reports, select the property and year
4. Add travel deduction - verify calculation uses correct values
5. Add laundry deduction - verify calculation
6. Add custom deduction - verify it appears
7. Verify all three appear in tax breakdown with correct totals
8. Verify net taxable income is reduced by deduction amounts
9. Run `npm run test` in both backend and frontend
