# Oikotie Import Frontend Support - Implementation Plan

## Overview

Add frontend support for Oikotie property imports, creating a unified component for both Etuovi and Oikotie URL inputs. The backend API for Oikotie import was implemented in commit `cd3883b` and follows the same pattern as Etuovi import.

**Backend API Endpoints (already implemented):**
- `POST /api/import/oikotie/fetch` - Fetch property data from Oikotie URL
- `POST /api/import/oikotie/create-prospect` - Create prospect property from Oikotie URL

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/components/property/ListingImportInput.tsx` | **Create** | Unified component with source selector (Etuovi/Oikotie) and URL input |
| `frontend/src/components/property/ListingImportInput.test.tsx` | **Create** | Unit tests for the new component |
| `frontend/src/components/property/ProspectAddChoiceDialog.tsx` | **Modify** | Replace Etuovi-only input with `ListingImportInput` component |
| `frontend/src/components/property/ProspectAddChoiceDialog.test.tsx` | **Modify** | Update tests for Oikotie support |
| `frontend/src/components/investment-calculator/InvestmentCalculatorForm.tsx` | **Modify** | Replace Etuovi-only fetch with unified component |
| `frontend/src/components/investment-calculator/InvestmentCalculatorForm.test.tsx` | **Modify** | Update tests for Oikotie support |
| `frontend/src/translations/property/en.ts` | **Modify** | Add Oikotie-related translation keys |
| `frontend/src/translations/property/fi.ts` | **Modify** | Add Oikotie-related translation keys |
| `frontend/src/translations/property/sv.ts` | **Modify** | Add Oikotie-related translation keys |
| `frontend/src/translations/investment-calculator/en.ts` | **Modify** | Add/update import source translation keys |
| `frontend/src/translations/investment-calculator/fi.ts` | **Modify** | Add/update import source translation keys |
| `frontend/src/translations/investment-calculator/sv.ts` | **Modify** | Add/update import source translation keys |
| `frontend/src/types/inputs.ts` | **Modify** | Add `OikotieFetchInput` and unified `ListingFetchInput` types |

**Already supporting Oikotie (no changes needed):**
- `frontend/src/components/property/sections/ExternalListingLink.tsx` - Already handles both sources
- `frontend/src/components/property/cards/ProspectPropertyCardContent.tsx` - Already handles both sources
- `frontend/src/components/property/sections/PropertyActionsMenu.tsx` - Already handles both sources
- `frontend/src/types/common.ts` - Already has `PropertyExternalSource.OIKOTIE`

## Implementation Steps

### Step 1: Add Frontend Types

**File:** `frontend/src/types/inputs.ts`

Add new type for listing import that supports both sources:

```typescript
// Listing import source
export type ListingSource = 'etuovi' | 'oikotie';

// Unified listing fetch input
export interface ListingFetchInput {
  url: string;
  monthlyRent?: number;
  source: ListingSource;
}
```

### Step 2: Add Translation Keys

**Files:** All three translation files for `property` and `investment-calculator` namespaces

**Property translations to add:**
```typescript
// New keys for unified import
importSource: 'Import Source',
selectSource: 'Select source',
importFromOikotie: 'Import from Oikotie',
oikotieUrlPlaceholder: 'Paste Oikotie property URL (e.g., https://asunnot.oikotie.fi/myytavat-asunnot/...)',
invalidOikotieUrl: 'Please enter a valid Oikotie URL',
invalidListingUrl: 'Please enter a valid property listing URL',
etuovi: 'Etuovi',
oikotie: 'Oikotie',
```

**Investment calculator translations to add:**
```typescript
// Unified listing import
listingUrl: 'Property listing URL',
selectListingSource: 'Source',
listingSource: 'Listing source',
fetchFromListing: 'Fetch data',
```

### Step 3: Create Unified ListingImportInput Component

**File:** `frontend/src/components/property/ListingImportInput.tsx`

Create a reusable component with:
- Source selector (dropdown/toggle) at the top: Etuovi / Oikotie
- URL input field with placeholder that changes based on selected source
- Optional monthly rent input
- Import/Fetch button
- Loading state handling
- URL validation based on selected source

**Component Props:**
```typescript
interface ListingImportInputProps {
  mode: 'prospect' | 'fetch';  // prospect = creates property, fetch = returns data
  onSuccess?: () => void;      // Called after successful prospect creation
  onDataFetched?: (data: PropertyData) => void;  // Called with fetched data
  showRentInput?: boolean;     // Whether to show monthly rent field
  loading?: boolean;
  disabled?: boolean;
}
```

**Key Implementation Details:**
- Uses `AssetSelectField` for source selector
- Uses `AssetTextField` for URL input
- Uses `AssetNumberField` for monthly rent
- Uses `AssetButton` for import/fetch action
- Validates URL against source-specific pattern before submission
- Calls appropriate API endpoint based on selected source

### Step 4: Create ListingImportInput Tests

**File:** `frontend/src/components/property/ListingImportInput.test.tsx`

Test scenarios:
- Renders with default source (Etuovi)
- Source selector changes URL placeholder
- Validates Etuovi URLs correctly
- Validates Oikotie URLs correctly
- Shows validation error for invalid URLs
- Calls correct API endpoint based on source
- Loading state disables inputs
- Success callback fires after successful import
- Error handling shows toast

### Step 5: Update ProspectAddChoiceDialog

**File:** `frontend/src/components/property/ProspectAddChoiceDialog.tsx`

Changes:
- Replace inline Etuovi import code with `ListingImportInput` component
- Update card title to be source-agnostic ("Import from Listing")
- Component handles source selection internally

### Step 6: Update ProspectAddChoiceDialog Tests

**File:** `frontend/src/components/property/ProspectAddChoiceDialog.test.tsx`

Update tests:
- Test source selector appears
- Test Etuovi URL import still works
- Test Oikotie URL import works
- Test validation for both URL types
- Test source-specific placeholder text

### Step 7: Update InvestmentCalculatorForm

**File:** `frontend/src/components/investment-calculator/InvestmentCalculatorForm.tsx`

Changes:
- Replace Etuovi-specific fetch with unified component
- Update section label to be source-agnostic
- Handle data from both sources

### Step 8: Update InvestmentCalculatorForm Tests

**File:** `frontend/src/components/investment-calculator/InvestmentCalculatorForm.test.tsx`

Update tests:
- Test renders listing source selector
- Test both Etuovi and Oikotie fetch work

## Data Flow

### Prospect Creation Flow
```
User selects source (Etuovi/Oikotie)
    ↓
User enters URL
    ↓
User optionally enters expected rent
    ↓
User clicks "Import"
    ↓
Frontend validates URL against source pattern
    ↓
Frontend calls POST /api/import/{source}/create-prospect
    ↓
Backend fetches and parses listing page
    ↓
Backend creates/updates Property entity
    ↓
Frontend shows success toast
    ↓
Dialog closes, property list refreshes
```

### Investment Calculator Fetch Flow
```
User selects source (Etuovi/Oikotie)
    ↓
User enters URL
    ↓
User clicks "Fetch"
    ↓
Frontend validates URL against source pattern
    ↓
Frontend calls POST /api/import/{source}/fetch
    ↓
Backend fetches and parses listing page
    ↓
Backend returns PropertyDataDto
    ↓
Frontend populates form fields with fetched data
    ↓
User continues editing calculation
```

## Edge Cases & Error Handling

| Case | How to Handle |
|------|---------------|
| Invalid URL format | Show validation error message specific to selected source |
| Listing not found (404) | Show toast: "Property listing not found" |
| Service blocked (403) | Show toast: "Access blocked. Please try again later." |
| Network timeout | Show toast: "Request timed out. Please try again." |
| Server error (500) | Show toast: "Failed to import property. Please try again." |
| Duplicate property | Backend handles by updating existing property |
| Empty URL submitted | Import button disabled when URL is empty |
| Source changed with URL filled | Clear URL field or keep it (consider UX) |

## Testing Strategy

### Unit Tests (colocated)

**ListingImportInput.test.tsx:**
- Renders with default source selection
- Source selector changes URL placeholder text
- Validates Etuovi URL pattern correctly
- Validates Oikotie URL pattern correctly
- Shows error for invalid URL after submit attempt
- Import button disabled when URL empty
- Loading state disables all inputs
- Calls onSuccess after successful import
- Calls onDataFetched with correct data structure
- Shows error toast on API failure

**ProspectAddChoiceDialog.test.tsx (updates):**
- Source selector appears in import section
- Can switch between Etuovi and Oikotie
- Imports from Etuovi work as before
- Imports from Oikotie work correctly
- Validation errors show for both sources

**InvestmentCalculatorForm.test.tsx (updates):**
- Listing source selector appears
- Can fetch from both Etuovi and Oikotie
- Form populates correctly from both sources

### Integration Tests

**Scenarios to cover:**
- Full prospect creation flow from Etuovi URL
- Full prospect creation flow from Oikotie URL
- Investment calculator fetch from both sources
- Error handling for unavailable listings

## CLAUDE.md Compliance Checklist

- [x] **Uses AssetComponents** - Uses AssetSelectField, AssetTextField, AssetNumberField, AssetButton
- [x] **i18n translations in all 3 languages** - English, Finnish, Swedish all updated
- [x] **Backend follows TypeORM patterns** - Backend already implemented, no changes needed
- [x] **Follows error handling conventions** - Uses try/catch with toast notifications
- [x] **Tests colocated with code** - All component tests in same directory
- [x] **No hardcoded text** - All user-facing strings use translation keys
- [x] **Theme-aware styling** - Uses MUI theme colors, no hardcoded colors

## Summary of Changes by Category

### New Files (2)
1. `frontend/src/components/property/ListingImportInput.tsx`
2. `frontend/src/components/property/ListingImportInput.test.tsx`

### Modified Components (2)
1. `frontend/src/components/property/ProspectAddChoiceDialog.tsx`
2. `frontend/src/components/investment-calculator/InvestmentCalculatorForm.tsx`

### Modified Tests (2)
1. `frontend/src/components/property/ProspectAddChoiceDialog.test.tsx`
2. `frontend/src/components/investment-calculator/InvestmentCalculatorForm.test.tsx`

### Modified Translations (6)
1. `frontend/src/translations/property/en.ts`
2. `frontend/src/translations/property/fi.ts`
3. `frontend/src/translations/property/sv.ts`
4. `frontend/src/translations/investment-calculator/en.ts`
5. `frontend/src/translations/investment-calculator/fi.ts`
6. `frontend/src/translations/investment-calculator/sv.ts`

### Modified Types (1)
1. `frontend/src/types/inputs.ts`
