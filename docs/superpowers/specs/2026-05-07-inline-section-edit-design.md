# Inline Section Edit for Property View

**Date:** 2026-05-07
**Status:** Approved (design phase)

## Problem

The property view at `/app/portfolio/prospects/:id` (and the equivalent OWN/SOLD routes — same `PropertyView` component) currently has only one editable section card: **Kuukausikulut** (Monthly Costs), which opens `PropertyChargeDialog` via a pencil icon.

All other section cards — Property Info, Location, Purchase, Sale — and the Description block are read-only. To change any of those fields the user must navigate away to the full property edit form.

We want the same per-section edit affordance everywhere, but with **inline editing** (fields transform in place) rather than a dialog.

## Goals

- Add a pencil icon to each non-charge section card on the property view.
- Clicking the pencil flips that section's rows into editable inputs.
- Each field saves on blur/Enter; Esc reverts that field's edit.
- Only one section is in edit mode at a time.
- Reuse Asset components throughout (no raw MUI inputs).
- All three languages updated (en, fi, sv).

## Non-Goals

- Monthly Costs section keeps its existing dialog (it manages historical charge entries with effective dates — out of scope for inline edit).
- KPI cards stay read-only (computed values).
- No changes to photo, status, ownerships, apartmentType, or rooms — those remain in the dedicated edit form (`/edit/:id`).
- No mobile-specific layout polish; the existing responsive grid is reused.
- No backend changes (the existing `PUT /api/real-estate/property/:id` endpoint already accepts the full DTO).

## Interaction Model

- **Pencil icon** in the `PropertyInfoCard.action` slot of every editable section card (Property Info, Location, Purchase, Sale, Description).
- **Click pencil** → all rows in that card flip to inline inputs prefilled with current values. The pencil icon swaps to a "done" check icon.
- **Per-field autosave**: on blur or Enter, that field PUTs to `/api/real-estate/property/:id` with the full property object updated. Esc reverts the field's pending edit.
- **Click the check icon** → exits edit mode (no extra save needed; each field already saved on blur).
- **Failed save** → toast error (`saveError` translation), field reverts to last server value.
- **Single-section edit lock**: clicking a second section's pencil exits the first section's edit mode automatically.

## Component Structure

### New: `EditableDetailRow`

Location: `frontend/src/components/property/shared/EditableDetailRow.tsx`

Props:
- `icon: ReactNode`
- `label: string`
- `value: string | number | Date | null | undefined`
- `editing: boolean`
- `inputType: 'text' | 'number' | 'currency' | 'date' | 'multiline'`
- `onSave: (newValue: unknown) => Promise<void>`
- Optional: `format?: (value: unknown) => string` for read-mode display, `min`/`max` for numeric ranges, `rows` for multiline.

Behavior:
- **Read mode** → renders the existing `DetailRow` component unchanged.
- **Edit mode** → renders the matching Asset input (`AssetTextField`, `AssetNumberField`, `AssetMoneyField`, `AssetDatePicker`) with:
  - autoFocus on first field when entering edit mode (handled by parent passing a flag, or by focusing the row that just toggled).
  - select-all on focus (`onFocus={(e) => e.target.select()}`) for text/number inputs.
  - Enter or blur → call `onSave(newValue)`. If `onSave` rejects, restore the prior value.
  - Esc → restore the prior value, blur the input.

### New hook: `useEditableSection`

Location: `frontend/src/components/property/shared/useEditableSection.ts`

Signature: `useEditableSection(activeKey: string | null, setActiveKey: (key: string | null) => void, sectionKey: string)` → `{ editing: boolean, toggle: () => void }`.

Coordinates "only one section in edit mode" by lifting `activeKey` state to the topmost shared parent. The lock spans **all five editable cards** (the four cards inside `PropertyInfoSection` plus the Description card in `PropertyView`), so `activeKey` is owned by `PropertyView` and passed down to `PropertyInfoSection` via props.

### New hook: `usePropertyFieldSave`

Location: `frontend/src/components/property/shared/usePropertyFieldSave.ts`

Signature: `usePropertyFieldSave(property: Property, onPropertyUpdated: (p: Property) => void)` → `saveField(patch: Partial<PropertyInputDto>) => Promise<void>`.

Behavior:
- Builds the full `PropertyInputDto` by spreading `property` + `patch` (the DTO marks `name` and `size` as required, so partial PUTs aren't safe).
- For nested `address` patches, merges with existing `property.address` so a single field change doesn't drop other address fields.
- Calls `ApiClient` to `PUT /real-estate/property/:id`.
- On success: invokes `onPropertyUpdated(updated)` so the parent re-renders with fresh values.
- On error: shows a toast (`saveError`) and rethrows so `EditableDetailRow` can revert.

### Modified: `PropertyInfoSection.tsx`

- Adds pencil icons to Property Info, Location, Purchase, Sale cards (Monthly Costs keeps its existing dialog pencil).
- Replaces `DetailRow` with `EditableDetailRow` for each editable field.
- Receives `activeKey` and `setActiveKey` as props (the lock state lives in `PropertyView`).
- Receives a new `onPropertyUpdated: (p: Property) => void` prop.
- Always renders Location, Purchase, and Sale cards regardless of empty data so the pencil is always reachable (empty values display as "—" in read mode, prefilled blank in edit mode). Sale card is still gated by `status === SOLD`; Purchase card is still gated by `status === OWN || SOLD`.

### Modified: `PropertyView.tsx`

- Owns the `activeKey` state (`useState<string | null>(null)`) and passes it (with `setActiveKey`) into `PropertyInfoSection` and into the Description card.
- Passes `setProperty` as the `onPropertyUpdated` prop to `PropertyInfoSection` and uses it for the Description card too.
- Description card: adds pencil + `EditableDetailRow` with `inputType: 'multiline'`. Always renders the card (even when description is empty) so users can add a description.

### Unchanged

- `PropertyInfoCard` already exposes an `action` slot.
- `DetailRow` is reused inside `EditableDetailRow`'s read mode.
- All Asset components are reused as-is.

## Field Mapping

| Section | Field | Input | Patch shape |
|---|---|---|---|
| Property Info | size | `AssetNumberField` (1–1000) | `{ size }` |
| Property Info | buildYear | `AssetNumberField` (1800–2100) | `{ buildYear }` |
| Location | street | `AssetTextField` | `{ address: { ...current, street } }` |
| Location | postalCode | `AssetTextField` | `{ address: { ...current, postalCode } }` |
| Location | city | `AssetTextField` | `{ address: { ...current, city } }` |
| Location | district | `AssetTextField` | `{ address: { ...current, district } }` |
| Purchase | purchaseDate | `AssetDatePicker` | `{ purchaseDate }` |
| Purchase | purchaseLoan | `AssetMoneyField` (≥0) | `{ purchaseLoan }` |
| Sale | saleDate | `AssetDatePicker` | `{ saleDate }` |
| Description | description | multiline `AssetTextField` (`multiline`, `rows={4}`, `maxRows={8}`) | `{ description }` |

Read-only and excluded: `pricePerSqm` (computed), monthly cost rows (dialog-managed), KPI values.

## Validation

- Client-side enforced by Asset inputs (numeric ranges, currency formatting, date format).
- On 400 from backend, show toast with the message and revert the field's edit.
- Empty inputs for optional fields send `undefined` (or empty string for text → backend treats as cleared).
- The DTO's required `name` and `size` are always supplied by spreading the existing property, so single-field edits never violate them.

## i18n

Add to `frontend/src/translations/en.ts`, `fi.ts`, `sv.ts` under the `property` namespace:
- `editSection` — pencil tooltip ("Edit section")
- `doneEditing` — check tooltip ("Done")
- `saveError` — toast message ("Failed to save change")

Reuse existing labels: `size`, `buildYear`, `address`, `city`, `district`, `purchaseDate`, `purchaseLoan`, `saleDate`, `description`, `street` (add if missing), `postalCode` (add if missing), and `notSet` / `—` placeholder for empty read-mode values (add if missing).

## API

No backend changes. Existing endpoint:
- `PUT /api/real-estate/property/:id` accepts `PropertyInputDto`.
- Response: updated `Property`.

## Tests

### Unit
- `EditableDetailRow.test.tsx` — covers each `inputType`:
  - read↔edit toggle when `editing` prop changes
  - blur saves, Enter saves, Esc reverts
  - save error reverts the displayed value
  - select-all on focus for text/number
- `usePropertyFieldSave.test.ts`:
  - top-level patch (e.g., `{ size: 50 }`) merges with full property
  - nested address patch merges with existing `property.address`
  - error path rethrows after toast

### Integration
- Extend or create `PropertyInfoSection.test.tsx`:
  - pencil toggles section into edit mode
  - clicking another section's pencil exits the first
  - MSW-mocked PUT round-trip refreshes the displayed value
  - Failed PUT (500) shows toast and reverts
- View test for `PropertyView` description card edit path (happy path + error).

### Translation coverage
- The existing translation coverage test will catch any missing key across en/fi/sv.

## Implementation Order

1. `EditableDetailRow` + tests for each input type.
2. `usePropertyFieldSave` + tests.
3. `useEditableSection` (small enough to test through the section integration test).
4. Wire `PropertyInfoSection` (Property Info + Location first, then Purchase + Sale).
5. Wire Description in `PropertyView`.
6. Add i18n keys to all three language files.
7. Update integration tests and run translation coverage.
