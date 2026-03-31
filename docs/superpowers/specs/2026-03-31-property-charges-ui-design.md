# Property Charges UI Integration

**Date:** 2026-03-31
**PR:** 132
**Branch:** feat/team-property-charges

## Overview

Integrate the existing `PropertyChargeDialog` and `PropertyChargeForm` components into the application UI, and migrate from storing charges on the property entity to using the `property_charge` table exclusively.

## Requirements

1. Replace inline charge fields in PropertyForm with charge API
2. Add mode: collect charges inline, save via batch endpoint after property creation
3. Edit mode: show current charges readonly with button to open modal
4. View mode: display current charges with button to open history modal
5. Support all four charge types with auto-calculation (maintenanceFee, financialCharge, waterPrepayment, totalCharge)
6. Remove old charge columns from property table
7. Make `startDate` nullable in property_charge table

## Backend Changes

### Database Migration

**New migration file:** `XXXXXX-MigrateChargeFieldsToPropertyCharge.ts`

1. Alter `property_charge.startDate` to be nullable
2. Drop columns from `property` table:
   - `maintenanceFee`
   - `financialCharge`
   - `waterCharge`

Note: `monthlyRent` stays on property (it's income, not a charge).

### New Endpoint

```
POST /api/real-estate/property/:id/charges/batch
Body: PropertyChargeInput[]
Response: PropertyChargeDto[]
```

Creates multiple charges in a single call for initial property setup.

### Entity Changes

**PropertyCharge entity:**
```typescript
@Column({ type: 'date', nullable: true })
startDate: Date | null;
```

**Property entity:**
Remove fields:
- `maintenanceFee`
- `financialCharge`
- `waterCharge`

### Service Updates

**PropertyChargeService:**
- Add `createBatch(user, propertyId, inputs[])` method
- Update `getCurrentCharges()` to handle null startDate (treat as "valid from beginning")

**Import Services (Oikotie, Etuovi):**
- Update to call `PropertyChargeService.createBatch()` after property creation
- Use `startDate = null` for imported listings

**InvestmentService:**
- Inject `PropertyChargeService`
- Fetch charges via `getCurrentCharges()` instead of reading from property

## Frontend Changes

### PropertyForm (Add Mode)

- Keep current charge fields UI with auto-calculation
- Store charges in local component state (not on property object)
- On save:
  1. Create property via existing endpoint
  2. Call `POST /property/:id/charges/batch` with charges
  3. Use `startDate = purchaseDate` if provided, otherwise `null`

### PropertyForm (Edit Mode)

- Fetch current charges via `GET /property/:id/charges/current` on load
- Display charge values as readonly fields
- Add "Manage Charges" button that opens `PropertyChargeDialog`
- On dialog close: refetch current charges to update display

### PropertyInfoSection (View)

- Fetch current charges via `GET /property/:id/charges/current`
- Display in Monthly Costs card (same layout as now)
- Add "View History" link/button that opens `PropertyChargeDialog`

### Type Updates

**entities.ts - Property interface:**
Remove:
- `maintenanceFee?: number`
- `financialCharge?: number`
- `waterCharge?: number`

**inputs.ts - PropertyInput interface:**
Remove same fields.

## Files to Modify

### Backend

| File | Changes |
|------|---------|
| `property-charge.entity.ts` | Make startDate nullable |
| `property.entity.ts` | Remove charge fields |
| `property-charge.service.ts` | Add createBatch(), update date handling |
| `property-charge.controller.ts` | Add batch endpoint |
| `property-charge-input.dto.ts` | Allow null startDate |
| `oikotie-import.service.ts` | Use charge API instead of property fields |
| `etuovi-import.service.ts` | Use charge API instead of property fields |
| `investment.service.ts` | Fetch charges from charge service |
| `investment-calculator.class.ts` | Accept charges as parameter |
| New migration file | Alter startDate, drop property columns |
| `property-charge.service.spec.ts` | Update tests |
| `property-charge.e2e-spec.ts` | Add batch endpoint tests |
| `oikotie-import.service.spec.ts` | Update tests |
| `etuovi-import.service.spec.ts` | Update tests |
| `investment.service.spec.ts` | Update tests |

### Frontend

| File | Changes |
|------|---------|
| `PropertyForm.tsx` | Separate charge state, batch save logic |
| `PropertyInfoSection.tsx` | Fetch charges via API, add history button |
| `entities.ts` | Remove charge fields from Property |
| `inputs.ts` | Remove charge fields from PropertyInput |
| `PropertyForm.test.tsx` | Update tests |
| `PropertyInfoSection.test.tsx` | Update tests, mock charge API |

## API Contracts

### Batch Create Charges

**Request:**
```http
POST /api/real-estate/property/123/charges/batch
Content-Type: application/json

[
  { "chargeType": 1, "amount": 150.00, "startDate": "2024-01-15", "endDate": null },
  { "chargeType": 2, "amount": 50.00, "startDate": "2024-01-15", "endDate": null },
  { "chargeType": 3, "amount": 25.00, "startDate": "2024-01-15", "endDate": null }
]
```

**Response:**
```json
[
  { "id": 1, "propertyId": 123, "chargeType": 1, "typeName": "maintenance-fee", "amount": 150.00, "startDate": "2024-01-15", "endDate": null },
  { "id": 2, "propertyId": 123, "chargeType": 2, "typeName": "financial-charge", "amount": 50.00, "startDate": "2024-01-15", "endDate": null },
  { "id": 3, "propertyId": 123, "chargeType": 3, "typeName": "water-prepayment", "amount": 25.00, "startDate": "2024-01-15", "endDate": null },
  { "id": 4, "propertyId": 123, "chargeType": 4, "typeName": "total-charge", "amount": 225.00, "startDate": "2024-01-15", "endDate": null }
]
```

Note: `totalCharge` (type 4) is auto-calculated and created by the backend.

## Testing Requirements

### Backend Unit Tests
- `createBatch()` creates all charge types
- `createBatch()` auto-calculates total charge
- `getCurrentCharges()` handles null startDate correctly
- Import services create charges via batch API

### Backend E2E Tests
- `POST /property/:id/charges/batch` - success case
- `POST /property/:id/charges/batch` - unauthorized (wrong property owner)
- Import flow creates charges correctly

### Frontend Tests
- PropertyForm saves charges after property creation
- PropertyForm edit mode shows readonly charges
- PropertyInfoSection fetches and displays current charges
- History button opens PropertyChargeDialog
