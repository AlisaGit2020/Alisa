# Prospect Property Add Choice Design

## Overview

When adding a prospect property, users should choose between importing from Etuovi or filling the form manually. This is presented via a modal dialog.

## User Flow

1. User is on Prospects tab in Properties view
2. User clicks "Add" link
3. Modal opens with two options:
   - **Import from Etuovi** - Shows URL input field, imports property data automatically
   - **Add manually** - Navigates to PropertyForm
4. For Etuovi import:
   - User pastes Etuovi URL (e.g., `https://www.etuovi.com/kohde/12345`)
   - Clicks "Import" button
   - Loading spinner shows during API call
   - On success: Toast shows "Property imported successfully", modal closes, list refreshes
   - On error: Toast shows error message, modal stays open for retry
5. For manual add:
   - User clicks the manual option
   - Modal closes, navigates to `/app/portfolio/properties/prospects/add`

## Modal UI Design

```
┌─────────────────────────────────────────────┐
│  Add Prospect Property              [X]     │
├─────────────────────────────────────────────┤
│                                             │
│  How would you like to add a property?      │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 🏠 Import from Etuovi               │    │
│  │                                     │    │
│  │ [Etuovi URL input field          ]  │    │
│  │                                     │    │
│  │              [Import]               │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ✏️ Fill in form manually            │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

- Both options are clickable cards
- Etuovi option displays URL input inline
- Loading state disables form during submission
- Error displays inline within Etuovi section

## Component Structure

### New Component: ProspectAddChoiceDialog

**Location:** `frontend/src/components/property/ProspectAddChoiceDialog.tsx`

**Props:**
- `open: boolean` - Dialog visibility
- `onClose: () => void` - Close callback
- `onSuccess: () => void` - Called after successful Etuovi import (triggers list refresh)
- `onManualAdd: () => void` - Called when user chooses manual add

**Internal State:**
- `etuoviUrl: string` - URL input value
- `loading: boolean` - API call in progress
- `error: string | null` - Error message

**API Call:**
- `POST /api/import/etuovi/create-prospect` with `{ url: string }`
- Returns created Property on success

### Changes to AssetCardList

Add optional callback prop:
- `onAddClick?: () => void` - When provided, triggers callback instead of navigating to add route

### Changes to Properties.tsx

- Add state: `const [addDialogOpen, setAddDialogOpen] = useState(false)`
- Pass `onAddClick={() => setAddDialogOpen(true)}` to Prospects tab AssetCardList
- Render `<ProspectAddChoiceDialog>` with appropriate handlers
- On success: close dialog, dispatch `PROPERTY_LIST_CHANGE_EVENT` to refresh list

## Translations

Add to `frontend/src/translations/en.ts`, `fi.ts`, `sv.ts`:

```typescript
// property namespace
addProspectTitle: "Add Prospect Property",
chooseAddMethod: "How would you like to add a property?",
importFromEtuovi: "Import from Etuovi",
etuoviUrlPlaceholder: "Paste Etuovi property URL",
importButton: "Import",
addManually: "Fill in form manually",
importSuccess: "Property imported successfully",
importError: "Failed to import property",
```

## Test Plan

### Unit Tests: ProspectAddChoiceDialog.test.tsx
- Renders with two option cards
- Shows URL input in Etuovi section
- Validates URL format before submission
- Shows loading state during API call
- Displays success toast and closes on successful import
- Displays error toast on failed import
- Navigates to form on manual add selection
- Closes on X button click

### Integration Tests: Properties.test.tsx (additions)
- Clicking Add on Prospects tab opens modal
- Full Etuovi import flow with mocked API
- Manual add navigates to form

## Dependencies

- Existing backend endpoint: `POST /api/import/etuovi/create-prospect`
- AssetDialog component for modal
- AssetTextField for URL input
- AssetButton for actions
- useToast hook for notifications
