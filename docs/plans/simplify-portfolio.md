# Implementation Plan: Simplify Portfolio Navigation

## Overview

This plan simplifies the portfolio navigation by:
1. **Redirecting `/app/portfolio` directly to `/app/portfolio/properties/own`** (skipping the hub page intermediate step)
2. **Moving the Investment Calculator to a new page within the Properties view** as a fourth tab alongside Own, Prospects, and Sold properties
3. **Removing the portfolio hub page** since it will no longer be needed

### Current Flow:
```
Portfolio (sidebar) → PortfolioHub (shows cards for Properties & Investment Calculator) → Properties page (tabs: Own, Prospects, Sold)
```

### New Flow:
```
Portfolio (sidebar) → Properties page (tabs: Own, Prospects, Sold, Investment Calculator)
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `/frontend/src/components/AppRoutes.tsx` | Modify | Change `/app/portfolio` to redirect to properties, remove hub route |
| `/frontend/src/components/property/Properties.tsx` | Modify | Add Investment Calculator as 4th tab |
| `/frontend/src/lib/menu-config.tsx` | Modify | Remove subPages from portfolio (no longer needs hub), update route |
| `/frontend/src/components/hub/PortfolioHub.tsx` | Delete | No longer needed |
| `/frontend/src/components/hub/index.ts` | Modify | Remove PortfolioHub export |
| `/frontend/src/components/hub/HubPage.test.tsx` | Modify | Update tests (portfolio no longer uses HubPage) |
| `/frontend/src/translations/property/en.ts` | Modify | Add translation for "Investment Calculator" tab |
| `/frontend/src/translations/property/fi.ts` | Modify | Add Finnish translation |
| `/frontend/src/translations/property/sv.ts` | Modify | Add Swedish translation |
| `/frontend/src/components/property/Properties.test.tsx` | Modify | Add tests for Investment Calculator tab |

## Implementation Steps

### Step 1: Update Routing Configuration
**File:** `/frontend/src/components/AppRoutes.tsx`

1. Change the `/app/portfolio` route to redirect to `/app/portfolio/properties/own` instead of rendering `<PortfolioHub />`
2. Keep the investment calculations route but move it under `/app/portfolio/properties/investment-calculator` for consistency
3. Update backward compatibility redirects

### Step 2: Update Menu Configuration
**File:** `/frontend/src/lib/menu-config.tsx`

Remove the `subPages` array from the portfolio menu item since we no longer need a hub page.

### Step 3: Add Investment Calculator Tab to Properties
**File:** `/frontend/src/components/property/Properties.tsx`

1. Add a 4th tab constant: TAB_CALCULATOR = 3
2. Update `getTabIndexFromRoute()` to handle the calculator route
3. Update `getRouteFromTabIndex()`
4. Add the Investment Calculator tab to the Tabs component
5. Add the TabPanel for Investment Calculator
6. Add required imports

### Step 4: Update Translations

Add `investmentCalculator` key to property translations in all 3 languages.

### Step 5: Remove PortfolioHub

Delete the file and update exports/imports.

### Step 6: Update Tests

Update HubPage tests and Properties tests.

## Data Flow

### Before:
```
User clicks Portfolio → AppRoutes renders PortfolioHub → HubPage reads menuConfig.portfolio.subPages → Renders cards → User clicks Properties card → Navigate to /app/portfolio/properties → Redirect to /app/portfolio/properties/own → Properties component loads
```

### After:
```
User clicks Portfolio → AppRoutes redirects to /app/portfolio/properties/own → Properties component renders with 4 tabs → User can switch between Own/Prospects/Sold/Investment Calculator tabs
```

## Edge Cases & Error Handling

### Case 1: Deep links to old portfolio hub
- **Scenario:** Users have bookmarked `/app/portfolio`
- **Handling:** The redirect to `/app/portfolio/properties/own` handles this automatically

### Case 2: Deep links to investment calculations
- **Scenario:** Users have bookmarked `/app/portfolio/investment-calculations` (old route)
- **Handling:** Add backward compatibility redirect

### Case 3: Investment Calculator URL parameters
- **Scenario:** Investment Calculator has URL parameters (e.g., `?saved=true`)
- **Handling:** The InvestmentCalculatorProtected component uses `useSearchParams` which will continue to work

## Testing Strategy

### Unit Tests Needed:
1. Properties.test.tsx - Test Investment Calculator tab routing
2. HubPage.test.tsx - Update tests (remove portfolio-specific)

### Key Scenarios to Cover:
1. Direct navigation to `/app/portfolio` shows Properties page
2. All 4 tabs (Own, Prospects, Sold, Investment Calculator) are visible
3. Tab switching updates URL correctly
4. Investment Calculator functionality works within tab context
5. Sidebar highlighting works correctly for portfolio section

## CLAUDE.md Compliance Checklist

- [x] Uses AssetComponents (not raw MUI)
- [x] i18n translations in all 3 languages (en, fi, sv)
- [x] Backend follows TypeORM patterns (N/A - frontend only)
- [x] Follows error handling conventions
- [x] Tests colocated with code