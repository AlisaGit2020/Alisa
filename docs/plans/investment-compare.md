# Implementation Plan: Investment Calculation Compare View

## Overview

This plan creates a new investment calculation compare view at `/app/portfolio/prospect` that allows users to:
1. View a list of all saved investment calculations with property images as avatars
2. Drag and drop calculations into a comparison area
3. Compare multiple calculations side-by-side using the existing `InvestmentComparisonTable` component
4. Maintain mobile responsiveness

The existing public investment calculator at `/investment-calculator` will remain unchanged. After this feature is complete, the `/app/portfolio/investment-calculator` route (currently TAB_CALCULATOR in Properties.tsx) can be removed as it will be replaced by this new view.

## Existing Code Analysis

### Investment Calculation Components

1. **`InvestmentComparisonTable`** (`/frontend/src/components/property/sections/InvestmentComparisonTable.tsx`)
   - Renders calculations in a comparison table format with sticky first column
   - Shows input fields (editable) and output fields (calculated)
   - Supports inline editing with API recalculation
   - Has delete functionality with confirmation dialog
   - This component can be reused directly for the comparison view

2. **`InvestmentCalculatorResults`** (`/frontend/src/components/investment-calculator/InvestmentCalculatorResults.tsx`)
   - Defines `InvestmentResults` and `SavedInvestmentCalculation` interfaces
   - Shows results in a card-based vertical layout
   - Used in the public calculator view

3. **`SavedCalculations`** (`/frontend/src/components/investment-calculator/SavedCalculations.tsx`)
   - Lists calculations in an `AssetDataTable`
   - Supports bulk delete, view dialog, edit dialog
   - Uses `ApiClient.search("real-estate/investment", {})` to fetch all user calculations

4. **`ProspectInvestmentSection`** (`/frontend/src/components/property/sections/ProspectInvestmentSection.tsx`)
   - Shows calculations for a specific property
   - Uses `InvestmentComparisonTable` for display
   - Filters by `propertyId`

### Data Structures

**Investment Entity** (`/backend/src/real-estate/investment/entities/investment.entity.ts`):
- `id`, `userId`, `propertyId?`, `name?`
- Input fields: `deptFreePrice`, `deptShare`, `transferTaxPercent`, `maintenanceFee`, `chargeForFinancialCosts`, `rentPerMonth`, `apartmentSize?`, `waterCharge?`, `downPayment?`, `loanInterestPercent?`, `loanPeriod?`
- Calculated fields: `sellingPrice`, `transferTax`, `maintenanceCosts`, `rentalYieldPercent`, `rentalIncomePerYear`, `pricePerSquareMeter`, `loanFinancing`, `loanFirstMonthInterest`, `loanFirstMonthInstallment`, `taxDeductibleExpensesPerYear`, `profitPerYear`, `taxPerYear`, `expensesPerMonth`, `cashFlowPerMonth`, `cashFlowAfterTaxPerMonth`

**Relationship**: Investment has optional `property` relationship via `propertyId`. When `propertyId` is set, the calculation is linked to a specific property.

### Drag and Drop Pattern

The project uses `@dnd-kit/core` and `@dnd-kit/sortable` for drag and drop (seen in Dashboard). Key components:
- `DndContext` - Provider wrapper
- `SortableContext` - Context for sortable items
- `useSortable` hook - Makes items draggable
- `closestCenter` - Collision detection algorithm

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `/frontend/src/components/investment-calculator/ProspectCompareView.tsx` | Create | Main compare view component with drag-drop functionality |
| `/frontend/src/components/investment-calculator/CalculationListItem.tsx` | Create | Draggable list item showing calculation with property avatar |
| `/frontend/src/components/investment-calculator/ComparisonDropZone.tsx` | Create | Drop zone area showing selected calculations for comparison |
| `/frontend/src/components/AppRoutes.tsx` | Modify | Add route for `/app/portfolio/prospect` |
| `/frontend/src/components/property/Properties.tsx` | Modify | Change TAB_PROSPECT to render new ProspectCompareView |
| `/frontend/src/translations/investment-calculator/en.ts` | Modify | Add new translation keys |
| `/frontend/src/translations/investment-calculator/fi.ts` | Modify | Add Finnish translations |
| `/frontend/src/translations/investment-calculator/sv.ts` | Modify | Add Swedish translations |
| `/frontend/src/components/investment-calculator/ProspectCompareView.test.tsx` | Create | Test for main view |
| `/frontend/src/components/investment-calculator/CalculationListItem.test.tsx` | Create | Test for list item component |
| `/frontend/src/components/investment-calculator/ComparisonDropZone.test.tsx` | Create | Test for drop zone component |

## Implementation Steps

### Step 1: Create CalculationListItem Component

Create a draggable list item that displays:
- Property photo as Avatar (using MUI Avatar with `getPhotoUrl`)
- Property name (from linked property or placeholder)
- Calculation name
- Key metric (rental yield or cash flow)

```typescript
// Component structure
interface CalculationListItemProps {
  calculation: SavedInvestmentCalculation & { property?: Property };
  isDragging?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}
```

This component will use `useSortable` from `@dnd-kit/sortable` to enable drag functionality.

### Step 2: Create ComparisonDropZone Component

Create a drop zone that:
- Accepts dropped calculations
- Shows "Drop calculations here to compare" placeholder when empty
- Renders `InvestmentComparisonTable` when calculations are present
- Allows removing calculations from comparison

```typescript
interface ComparisonDropZoneProps {
  calculations: SavedInvestmentCalculation[];
  onRemove: (id: number) => void;
  onUpdate: (calculation: SavedInvestmentCalculation) => void;
}
```

### Step 3: Create ProspectCompareView Component

Main view with two-panel layout:
- Left panel: Scrollable list of all calculations (grouped by property)
- Right panel: Comparison area with drop zone

For mobile, use stacked layout with collapsible list.

```typescript
// Layout structure (responsive)
// Desktop:
//   [Calculation List (30%)] | [Comparison Area (70%)]
// Mobile:
//   [Expandable List Panel]
//   [Comparison Area (full width)]
```

Features:
- Fetch all calculations with property relations using API
- Group calculations by property for better organization
- Use `DndContext` with `onDragEnd` to handle drops
- Persist selected calculations in component state

### Step 4: Update Routes

Modify `AppRoutes.tsx` to add the new route if needed.

### Step 5: Modify Properties.tsx

Change the TAB_PROSPECT panel to include the compare view functionality or add navigation to it.

### Step 6: Add Translations

Add new keys to all three language files.

## Data Flow

```
1. User navigates to /app/portfolio/prospect
                    ↓
2. ProspectCompareView mounts
                    ↓
3. Fetch all user's calculations with property relations
   ApiClient.search('real-estate/investment', { relations: { property: true } })
                    ↓
4. Group calculations by propertyId (null for unlinked)
                    ↓
5. Render CalculationListItem for each calculation in left panel
                    ↓
6. User drags calculation to ComparisonDropZone
                    ↓
7. onDragEnd adds calculation to selectedCalculations state
                    ↓
8. ComparisonDropZone renders InvestmentComparisonTable with selected calculations
                    ↓
9. User edits values in table → InvestmentComparisonTable calls API to recalculate
                    ↓
10. Updated calculation propagates back to state
```

## Edge Cases and Error Handling

### Case 1: No calculations exist
- Show empty state with "No calculations yet" message and link to create new calculation

### Case 2: Calculation without linked property
- Show in "Unlinked Calculations" group with placeholder avatar icon

### Case 3: Property photo missing
- Use placeholder image via `getPhotoUrl(undefined)`

### Case 4: Maximum comparisons reached
- Limit to 5 calculations with toast notification

### Case 5: Drag cancelled
- `DndContext` handles this automatically - no state change occurs

### Case 6: API error during fetch
- Show error alert with retry button

### Case 7: Duplicate selection
- Check if calculation already in selection, show toast if duplicate

## Mobile Considerations

### Layout Strategy

**Desktop (md and up)**:
- Two-column layout: 30% list / 70% comparison
- List scrolls independently
- Comparison table has horizontal scroll for many calculations

**Tablet (sm)**:
- Two-column layout: 40% list / 60% comparison
- Slightly larger touch targets

**Mobile (xs)**:
- Stacked layout with collapsible list
- List panel can be expanded/collapsed via button
- Comparison area takes full width
- Table scrolls horizontally with sticky first column

### Touch-Friendly Drag and Drop

- Use larger touch targets (min 48px)
- Add visual feedback during drag
- `@dnd-kit` supports touch by default with `PointerSensor`

## Testing Strategy

### Unit Tests Needed

1. **CalculationListItem.test.tsx**
   - Renders calculation name and property name
   - Shows property photo as avatar
   - Shows placeholder for missing photo
   - Click handler triggers callback
   - Visual feedback when selected/dragging

2. **ComparisonDropZone.test.tsx**
   - Shows placeholder when empty
   - Renders InvestmentComparisonTable with calculations
   - Remove button removes calculation

3. **ProspectCompareView.test.tsx**
   - Fetches calculations on mount
   - Groups calculations by property
   - Shows empty state when no calculations
   - Handles API errors
   - Maximum selection limit works
