# Implementation Plan: Add District Field to Properties

## Overview

This feature adds a `district` field to store city neighborhoods/districts (e.g., "Keskusta", "Palosaari" in Vaasa). The field will be:
1. Stored in the `Address` entity alongside `street`, `city`, and `postalCode`
2. Populated automatically when importing properties from Etuovi
3. Displayed in property forms, cards, and detail views
4. Available for user editing via the property form

The full address format will be: `"Rantakatu 22, Keskusta, Vaasa"` or similar.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| **Backend - Entity & DTO** |
| `backend/src/real-estate/address/entities/address.entity.ts` | Modify | Add `district` column |
| `backend/src/real-estate/address/dtos/address-input.dto.ts` | Modify | Add `district` validation |
| `backend/src/migrations/XXXXXXX-AddDistrictToAddress.ts` | Create | Database migration |
| **Backend - Etuovi Import** |
| `backend/src/import/etuovi/dtos/etuovi-property-data.dto.ts` | Modify | Add `district` field |
| `backend/src/import/etuovi/etuovi-import.service.ts` | Modify | Parse district from Etuovi HTML |
| `backend/src/import/etuovi/etuovi-import.service.spec.ts` | Modify | Add tests for district parsing |
| `backend/test/data/mocks/import/etuovi.property.html` | Modify | Add district data to mock |
| **Frontend - Types** |
| `frontend/src/types/entities.ts` | Modify | Add `district` to Address interface |
| `frontend/src/types/inputs.ts` | Modify | Add `district` to AddressInput interface |
| **Frontend - Components** |
| `frontend/src/components/property/PropertyForm.tsx` | Modify | Add district input field |
| `frontend/src/components/property/PropertyForm.test.tsx` | Modify | Add tests for district field |
| `frontend/src/components/property/sections/PropertyInfoSection.tsx` | Modify | Display district in location card |
| `frontend/src/components/property/sections/PropertyInfoSection.test.tsx` | Modify | Add tests for district display |
| `frontend/src/components/property/cards/OwnPropertyCardContent.tsx` | Modify | Display district in address |
| `frontend/src/components/property/cards/OwnPropertyCardContent.test.tsx` | Modify | Add tests |
| `frontend/src/components/property/cards/ProspectPropertyCardContent.tsx` | Modify | Display district in address |
| `frontend/src/components/property/cards/ProspectPropertyCardContent.test.tsx` | Modify | Add tests |
| `frontend/src/components/property/cards/SoldPropertyCardContent.tsx` | Modify | Display district in address |
| `frontend/src/components/property/cards/SoldPropertyCardContent.test.tsx` | Modify | Add tests |
| **Frontend - Translations** |
| `frontend/src/translations/property/en.ts` | Modify | Add `district` translation |
| `frontend/src/translations/property/fi.ts` | Modify | Add `district` translation |
| `frontend/src/translations/property/sv.ts` | Modify | Add `district` translation |

---

## Implementation Steps

### Step 1: Backend - Database Migration (Required First)

### Step 2: Backend - Address Entity & DTO

### Step 3: Backend - Etuovi Import Service

### Step 4: Backend - Update Mock and Tests

### Step 5: Frontend - Update Types

### Step 6: Frontend - Property Form

### Step 7: Frontend - PropertyInfoSection

### Step 8: Frontend - Property Card Components

### Step 9: Frontend - Translations

### Step 10: Frontend & Backend Tests

---

## Testing Strategy

### Backend Unit Tests (`etuovi-import.service.spec.ts`)

1. **parseHtml tests:**
   - `parses district from location.district.defaultName`
   - `parses districtNameFreeForm as fallback when district object missing`
   - `returns undefined district when not present in HTML`
   - `unescapes unicode in district name`

2. **createPropertyInput tests:**
   - `maps district to address.district`
   - `does not set district when not provided`

### Frontend Unit Tests

1. **PropertyForm.test.tsx:**
   - `renders district input field`
   - `updates district when user types`
   - `loads existing district from property data`

2. **PropertyInfoSection.test.tsx:**
   - `displays district in location card when present`
   - `hides district row when not present`

### Mocking Requirements

- **IMPORTANT:** All Etuovi tests must use mock HTML, never real network requests
- Update `backend/test/data/mocks/import/etuovi.property.html` with district data
- Frontend tests should mock API responses with district in address

---

## CLAUDE.md Compliance Checklist

- [x] Uses AssetComponents (not raw MUI)
- [x] i18n translations in all 3 languages (en, fi, sv)
- [x] Backend follows TypeORM patterns
- [x] Follows error handling conventions
- [x] Tests colocated with code
- [x] Database migration required
- [x] Mock Etuovi responses - no real fetches in tests
