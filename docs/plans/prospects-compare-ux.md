# Implementation Plan: Portfolio/Prospects Feature Improvements

## Overview

This plan addresses six key improvements to the portfolio/prospects feature:
1. Create a dedicated route for the compare view with breadcrumb support
2. Redesign the tab UI to be less intrusive and more elegant
3. Fix misleading "drop here" translation
4. Enable adding calculations directly from apartments in the comparison left panel
5. Make portfolio tabs mobile-friendly
6. Remove the standalone investment calculator route, consolidating all functionality into prospects

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `/frontend/src/components/AppRoutes.tsx` | Modify | Add compare route, remove investment-calculator route |
| `/frontend/src/components/property/Properties.tsx` | Modify | Major refactor for new UI design and mobile tabs |
| `/frontend/src/components/property/ProspectsPanel.tsx` | Create | Extract prospects panel with list/compare toggle |
| `/frontend/src/components/investment-calculator/ProspectCompareView.tsx` | Modify | Add standalone page wrapper capability |
| `/frontend/src/components/investment-calculator/ComparisonDropZone.tsx` | Modify | Update translation key usage |
| `/frontend/src/components/investment-calculator/CalculationListItem.tsx` | Modify | Add "add calculation" button for apartments |
| `/frontend/src/components/investment-calculator/ApartmentCalculationDialog.tsx` | Create | Modal for adding calculation from apartment in compare view |
| `/frontend/src/translations/investment-calculator/en.ts` | Modify | Fix translation, add new keys |
| `/frontend/src/translations/investment-calculator/fi.ts` | Modify | Fix translation, add new keys |
| `/frontend/src/translations/investment-calculator/sv.ts` | Modify | Fix translation, add new keys |
| `/frontend/src/translations/route/en.ts` | Modify | Add compare route translation |
| `/frontend/src/translations/route/fi.ts` | Modify | Add compare route translation |
| `/frontend/src/translations/route/sv.ts` | Modify | Add compare route translation |
| `/frontend/src/translations/property/en.ts` | Modify | Add new tab/toggle translations |
| `/frontend/src/translations/property/fi.ts` | Modify | Add new tab/toggle translations |
| `/frontend/src/translations/property/sv.ts` | Modify | Add new tab/toggle translations |
| `/frontend/src/lib/menu-config.tsx` | Modify | Remove investment-calculator from menu (if present) |
| `/frontend/src/components/layout/Breadcrumbs.tsx` | Modify | Handle compare route entity resolution |
| `/frontend/src/components/investment-calculator/InvestmentCalculatorProtected.tsx` | Delete | No longer needed - functionality moves to prospects |
| `/frontend/src/components/investment-calculator/SavedCalculations.tsx` | Modify | Adapt for use within compare view only |

### Test Files

| File | Action | Purpose |
|------|--------|---------|
| `/frontend/src/components/property/Properties.test.tsx` | Modify | Update tests for new UI |
| `/frontend/src/components/property/ProspectsPanel.test.tsx` | Create | Tests for new component |
| `/frontend/src/components/investment-calculator/ApartmentCalculationDialog.test.tsx` | Create | Tests for new dialog |
| `/frontend/src/components/investment-calculator/ProspectCompareView.test.tsx` | Modify | Add tests for standalone route |
| `/frontend/test/views/ProspectsCompareView.test.tsx` | Create | E2E view test for compare page |

## Implementation Steps

### Phase 1: UI Redesign for Tabs (Requirement 2 & 5)

**Step 1.1: Replace secondary tabs with a toggle button**

The current design has nested tabs (main portfolio tabs + Properties/Compare sub-tabs) which is visually heavy. The creative solution:

**Replace the Properties/Compare sub-tabs with:**
- A **segmented button group** (ToggleButtonGroup) positioned in the toolbar area
- On mobile: Use an **icon-only toggle** or **floating action button** to switch between list and compare modes

```tsx
// Visual concept for desktop:
// [List Icon] [Compare Icon]  <- Compact toggle in top-right of prospects panel

// Visual concept for mobile:
// FAB button that toggles between list and compare view
```

**Step 1.2: Make main portfolio tabs mobile-friendly**

Convert the main tabs (My Properties, Prospects, Sold, Investment Calculator) to:
- **Desktop**: Standard horizontal tabs with icons
- **Mobile**:
  - Use **scrollable tabs** with condensed labels (icon-only on small screens)
  - Alternative: **Bottom navigation** or **swipeable tabs**

```tsx
// Implementation approach:
<Tabs
  variant="scrollable"
  scrollButtons="auto"
  allowScrollButtonsMobile
  sx={{
    '& .MuiTab-root': {
      minWidth: { xs: 'auto', sm: 120 },
      px: { xs: 1, sm: 2 },
    },
  }}
>
  <Tab
    icon={<HomeIcon />}
    label={isMobile ? undefined : t("ownProperties")}
  />
  ...
</Tabs>
```

**Step 1.3: Remove Investment Calculator tab**

Since all functionality will be in Prospects, remove the 4th tab entirely. The tab structure becomes:
1. My Properties
2. Prospects
3. Sold

### Phase 2: Routing Changes (Requirements 1 & 6)

**Step 2.1: Add compare route**

```tsx
// In AppRoutes.tsx
<Route path="portfolio/prospects" element={<Properties />} />
<Route path="portfolio/prospects/compare" element={<ProspectCompareView standalone />} />
```

**Step 2.2: Remove investment-calculator routes**

```tsx
// Remove these lines:
<Route path="portfolio/investment-calculator" element={<Properties />} />
<Route path="portfolio/investment-calculations" element={<Navigate ... />} />
<Route path="investment-calculations" element={<Navigate ... />} />

// Keep redirect for backward compatibility:
<Route path="portfolio/investment-calculator" element={<Navigate to="/app/portfolio/prospects" replace />} />
```

**Step 2.3: Update breadcrumbs**

Add "compare" to the route translations and ensure breadcrumbs display correctly:
- `/app/portfolio/prospects` -> "Portfolio / Prospects"
- `/app/portfolio/prospects/compare` -> "Portfolio / Prospects / Compare"

### Phase 3: Translation Fixes (Requirement 3)

**Step 3.1: Update misleading translations**

```typescript
// Current (misleading):
dropHereToCompare: 'Drop here to compare',

// Updated (accurate):
selectToCompare: 'Select calculations to compare',
// or
clickToCompare: 'Click to add to comparison',
```

Update in all three language files:
- `en.ts`: "Click calculations to compare"
- `fi.ts`: "Valitse laskelmia vertailuun"
- `sv.ts`: "Klicka på beräkningar för att jämföra"

### Phase 4: Add Calculation from Apartment (Requirement 4)

**Step 4.1: Create ApartmentCalculationDialog component**

This dialog appears when clicking "Add Calculation" on an apartment in the compare view's left panel. It:
- Uses the same form fields as `InvestmentCalculatorForm`
- Pre-fills data from the apartment when linked to a property
- For unlinked apartments, prompts for additional details

**Step 4.2: Modify CalculationListItem**

Add an "Add" button to apartments (property groups) in the left panel:

```tsx
// In the grouped calculation list, add a button next to each property header:
<ListSubheader>
  {property?.name}
  <IconButton onClick={() => openAddDialog(property)}>
    <AddIcon />
  </IconButton>
</ListSubheader>
```

**Step 4.3: Modify ProspectCompareView**

Add state and handler for the new calculation dialog:

```tsx
const [addDialogOpen, setAddDialogOpen] = useState(false);
const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

const handleAddCalculation = (property?: Property) => {
  setSelectedProperty(property || null);
  setAddDialogOpen(true);
};

// Pass to CalculationListItem:
onAddCalculation={handleAddCalculation}
```

### Phase 5: Code Cleanup

**Step 5.1: Remove unused files**

- Delete `InvestmentCalculatorProtected.tsx` (functionality consolidated)
- Update any imports that reference it

**Step 5.2: Refactor SavedCalculations**

Move any useful functionality into the compare view and remove redundant code.

## UI/UX Design Decisions

### 1. Tab Redesign: Segmented Control Instead of Nested Tabs

**Problem**: Two levels of tabs is visually overwhelming and confusing.

**Solution**: Use a segmented control (ToggleButtonGroup) for the Properties/Compare toggle:

```
+--------------------------------------------------+
| [Home] My Properties | [Search] Prospects | [Sell] Sold |
+--------------------------------------------------+
|                              [List] [Compare]    |  <- Segmented control
| +----------------+  +------------------+         |
| | Property Card  |  | Property Card    |         |
| +----------------+  +------------------+         |
```

**Mobile variation**:
- Main tabs become icon-only on xs breakpoint
- List/Compare toggle becomes a FAB or toolbar icon button

### 2. Mobile-Friendly Portfolio Tabs

**Implementation strategy**:
1. Use `variant="scrollable"` with `scrollButtons="auto"`
2. On mobile (xs breakpoint):
   - Show only icons
   - Use tooltips for labels
3. Maintain touch-friendly tap targets (min 48px)

### 3. Compare Route with Standalone Page

The compare view can be accessed two ways:
1. **In-context**: Toggle within prospects panel (no URL change, state-based)
2. **Standalone**: Via `/app/portfolio/prospects/compare` (URL-based, shareable)

Both render the same `ProspectCompareView` component, but standalone mode gets:
- Full-page layout
- Breadcrumb trail
- Back button to return to prospects list

### 4. Add Calculation Button UX

**For linked properties (has property association)**:
- Show "+" button next to property group header
- Pre-fill all property data (price, size, costs, etc.)
- Only ask for calculation-specific fields (name, financing terms)

**For unlinked calculations section**:
- Show "+" button in "Unlinked" section header
- Open full form since no property data to pre-fill
- Same form as InvestmentCalculatorForm

## Data Flow

### Navigation Flow
```
/app/portfolio -> Redirects to /app/portfolio/own
/app/portfolio/own -> Properties component (TAB_OWN)
/app/portfolio/prospects -> Properties component (TAB_PROSPECT)
/app/portfolio/prospects?view=compare -> Properties component (TAB_PROSPECT, compare mode)
/app/portfolio/prospects/compare -> ProspectCompareView (standalone)
/app/portfolio/sold -> Properties component (TAB_SOLD)
```

### State Management for Compare View
```
ProspectCompareView
  |
  +-> calculations (fetched from API)
  |
  +-> comparisonCalculations (selected for comparison)
  |
  +-> addDialogOpen + selectedProperty (for new calculation modal)
```

### API Calls
- `GET /api/real-estate/investment` - Fetch all calculations with property relations
- `POST /api/real-estate/investment` - Create new calculation
- `PUT /api/real-estate/investment/:id` - Update calculation
- `DELETE /api/real-estate/investment/:id` - Delete calculation

## Edge Cases & Error Handling

### Case 1: Empty Prospects List
**Handling**: Show empty state with:
- Message: "No prospect properties yet"
- CTA button to add first prospect (import or manual)

### Case 2: Empty Calculations for Comparison
**Handling**: Show instructional empty state:
- Message: "Select calculations from the list to compare" (updated translation)
- Visual hint showing click interaction

### Case 3: Maximum Calculations Reached
**Current handling**: Toast warning "Maximum 5 calculations can be compared"
**Keep as-is**: This is appropriate UX

### Case 4: Adding Calculation to Unlinked Apartment
**Handling**:
- Show full form (not simplified version)
- Require user to fill in property details
- Save creates standalone calculation (no property link)

### Case 5: Mobile Viewport Navigation
**Handling**:
- Tabs scroll horizontally with touch gestures
- Compare toggle remains visible in sticky header
- Back button on compare page returns to list view

### Case 6: Network Errors
**Handling**:
- Show error state with retry button (existing pattern)
- Toast notifications for save/delete failures
- Optimistic updates with rollback on error

### Case 7: Backward Compatibility
**Handling**:
- `/app/portfolio/investment-calculator` -> Redirect to `/app/portfolio/prospects`
- `/app/investment-calculations` -> Redirect to `/app/portfolio/prospects`
- Old bookmarks/links continue to work

## Testing Strategy

### Unit Tests

**Properties.test.tsx**
- Renders all tabs correctly
- Tab navigation updates URL
- Mobile view shows icon-only tabs
- List/Compare toggle works
- Removal of investment calculator tab

**ProspectsPanel.test.tsx** (new)
- Renders property list by default
- Toggle switches to compare view
- Mobile toggle button works
- URL sync with view state

**ApartmentCalculationDialog.test.tsx** (new)
- Pre-fills data from property
- Validates required fields
- Submits to API correctly
- Handles errors gracefully

**CalculationListItem.test.tsx** (update)
- Renders add button when onAddCalculation provided
- Calls handler with property data
- Handles missing property gracefully

**ComparisonDropZone.test.tsx** (update)
- Uses new translation key
- Empty state displays correct message

### Integration/E2E Tests

**ProspectsCompareView.test.tsx** (view test)
- Happy path: Navigate to compare, select calculations, view comparison
- Add calculation from apartment group
- Error handling: API failures display appropriate messages
- Mobile: Verify touch interactions work

### Key Scenarios to Cover

1. **Full workflow**: Create prospect -> Add calculation -> Compare with other -> Remove
2. **Mobile navigation**: Switch between tabs using swipe/scroll
3. **Route transitions**: Direct navigation to compare route, back button behavior
4. **Empty states**: No prospects, no calculations, compare with nothing selected
5. **Validation**: Required field validation in add calculation dialog
6. **Translations**: All new keys present in en, fi, sv

## CLAUDE.md Compliance Checklist

- [x] **Uses AssetComponents**: All forms use AssetTextField, AssetNumberField, AssetButton, AssetDialog, etc.
- [x] **i18n translations**: All new text will be added to en.ts, fi.ts, sv.ts
- [x] **Follows error handling conventions**: Toast notifications, try/catch with console.error
- [x] **Tests colocated with code**: Unit tests in same directory as components
- [x] **View tests in frontend/test/views/**: Integration tests for full page views
- [x] **Uses theme colors**: All colors via theme.palette, no hardcoded values
- [x] **Uses AssetDataTable**: Where applicable for tabular data
- [x] **Path aliases**: @asset-lib/, @asset-types, etc.
- [x] **No database changes**: This is frontend-only work, no migrations needed

---

## Summary of Creative Solutions

1. **Segmented Control**: Replaces nested tabs with an elegant toggle that feels native and reduces visual clutter
2. **Responsive Tab Labels**: Icon-only on mobile, full labels on desktop - maintains functionality while saving space
3. **FAB for Mobile Compare**: Optional floating action button pattern for quick view switching on touch devices
4. **In-Context Add**: Adding calculations directly from the comparison view eliminates navigation friction
5. **Unified Route Structure**: Single `/prospects` route with sub-route for compare creates clean, shareable URLs