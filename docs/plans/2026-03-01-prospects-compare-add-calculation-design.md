# Prospects Compare View: Add Calculation for Apartments

**Date:** 2026-03-01
**Status:** Approved

## Overview

Add the ability to create investment calculations for apartments directly from the prospects compare view (`/app/portfolio/prospects?view=compare`), using the same form as PropertyView with defaults populated from apartment data.

## Requirements

1. Left panel shows all prospects grouped by apartment
2. Each apartment displays its calculations nested underneath
3. Each apartment has an "Add Calculation" button
4. All prospects shown, even those without calculations
5. Form uses existing `InvestmentAddDialog` with property defaults
6. New calculations auto-added to comparison table (max 5)

## UI Design

```
┌─────────────────────────────────┐
│ 📍 Kauppakatu 5, Helsinki       │  ← Apartment header (address)
│   ├─ Calculation A          [+] │  ← Existing calculation
│   └─ ➕ Add Calculation         │  ← Add button
├─────────────────────────────────┤
│ 📍 Mäkelänkatu 12, Espoo        │  ← Another apartment
│   └─ ➕ Add Calculation         │  ← No calculations yet
├─────────────────────────────────┤
│ 📍 Töölönkatu 8, Helsinki       │
│   ├─ Scenario 1             [+] │
│   ├─ Scenario 2             [+] │
│   └─ ➕ Add Calculation         │
└─────────────────────────────────┘
```

**Behavior:**
- Click on calculation → adds to comparison (existing behavior)
- Click "Add Calculation" → opens `InvestmentAddDialog` pre-filled with apartment data
- Apartments sorted by address
- `[+]` indicates "add to comparison" action

## Data Flow

**Fetching:**
1. Fetch all prospect properties: `GET /api/real-estate/property/search?status=PROSPECT`
2. Fetch all calculations: `GET /api/real-estate/investment` (existing)
3. Group calculations by `propertyId` in component

**Add calculation flow:**
1. User clicks "Add Calculation" on apartment
2. `InvestmentAddDialog` opens with `property` prop (provides defaults)
3. Form pre-fills from property: `deptFreePrice`, `rentPerMonth`, `apartmentSize`, etc.
4. User submits → `POST /api/real-estate/investment`
5. New calculation added to list and auto-added to comparison (if < 5)

## Files to Modify

- `frontend/src/components/investment-calculator/ProspectCompareView.tsx` - restructure left panel, add property fetching
- Import existing `InvestmentAddDialog` from `property/sections/`

**No backend changes required.**

## Testing Plan (TDD)

### Unit Tests (`ProspectCompareView.test.tsx`)
- Renders apartments grouped with their calculations
- Shows apartments with no calculations
- Shows "Add Calculation" button for each apartment
- Opens dialog when "Add Calculation" clicked
- Auto-adds new calculation to comparison after create

### Integration Tests (MSW mocked API)
- Fetches and groups prospects with calculations
- Creates calculation with property defaults
- Refetches list after creation

## Implementation Approach

TDD: Write failing tests first, implement to pass, refactor.
