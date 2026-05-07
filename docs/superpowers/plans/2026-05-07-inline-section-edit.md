# Inline Section Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-section pencil → inline-editable fields to the property view (Property Info, Location, Purchase, Sale, Description), with per-field autosave on blur/Enter and Esc-to-revert. Only one section in edit mode at a time across all five cards.

**Architecture:** A reusable `EditableDetailRow` component swaps between the existing read-only `DetailRow` and an Asset input bound to per-field autosave. A `usePropertyFieldSave` hook merges patches into the full `PropertyInputDto` and PUTs to `/api/real-estate/property/:id`. The "single section in edit mode" lock is owned by `PropertyView` and passed down. Spec: `docs/superpowers/specs/2026-05-07-inline-section-edit-design.md`.

**Tech Stack:** React 19 + TypeScript, Material-UI, Asset components (`AssetTextField`, `AssetNumberField`, `AssetMoneyField`, `AssetDatePicker`, `useToast`), `ApiClient` (axios), Jest + Testing Library + `userEvent`, i18next.

---

## File Structure

**Create:**
- `frontend/src/components/property/shared/EditableDetailRow.tsx` — read↔edit row swap; per-field save on blur/Enter, Esc revert.
- `frontend/src/components/property/shared/EditableDetailRow.test.tsx` — unit tests for each input type.
- `frontend/src/components/property/shared/usePropertyFieldSave.ts` — patch merger + PUT.
- `frontend/src/components/property/shared/usePropertyFieldSave.test.ts` — unit tests for the hook.
- `frontend/src/components/property/shared/useEditableSection.ts` — small hook coordinating the single-section lock.

**Modify:**
- `frontend/src/components/property/sections/PropertyInfoSection.tsx` — pencils + `EditableDetailRow` on Property Info, Location, Purchase, Sale cards; receives `activeKey`, `setActiveKey`, `onPropertyUpdated`; always renders Location/Purchase/Sale cards.
- `frontend/src/components/property/sections/PropertyInfoSection.test.tsx` — extend with edit-mode integration tests.
- `frontend/src/components/property/PropertyView.tsx` — owns `activeKey`; passes lock and `setProperty` (as `onPropertyUpdated`) into `PropertyInfoSection`; adds inline edit to Description card (always rendered).
- `frontend/test/views/PropertyView.test.tsx` — add Description edit happy/error paths.
- `frontend/src/translations/property/en.ts`, `fi.ts`, `sv.ts` — add `editSection`, `doneEditing`, `saveError`, `street`, `notSet` keys.

---

## Notes on infrastructure (read once before starting)

- **Test pattern**: tests use `renderWithProviders(...)` from `@test-utils/test-wrapper` and `createMockProperty` from `@test-utils/test-data`. API mocking uses `jest.spyOn(ApiClient, 'put')` etc — **not** MSW (the project's `frontend/test/msw/server.ts` exists but the established pattern in `PropertyView.test.tsx` and `PropertyInfoSection.test.tsx` is `jest.spyOn`).
- **Toast**: import `useToast` from `'../../asset'` (relative path used elsewhere — see `frontend/src/components/asset/AssetCardList.tsx:26`). `useToast()` returns `{ showToast }`. Call signature: `showToast({ message: string, severity: 'success' | 'error' | 'warning' | 'info' })`. Confirmed in `frontend/src/components/asset/toast/AssetToastProvider.tsx`.
- **ApiClient.put signature**: `ApiClient.put<T>(path: string, id: number, data: T): Promise<T>` (see `frontend/src/lib/api-client.ts:104`). For property: `ApiClient.put('real-estate/property', property.id, fullDto)`.
- **PropertyInputDto required fields**: `name` and `size`. Always spread `property` first so single-field PUTs include them.
- **AssetTextField/NumberField do NOT expose onKeyDown**. To handle Enter and Escape, wrap the input in a `Box` (or `div`) and attach `onKeyDown` to the wrapper — keyboard events bubble from the focused child input.
- **AssetDatePicker** uses dayjs `onChange(value, context)`. Saving on `onChange` (rather than blur) is correct for date pickers because each picker selection is a complete value.
- **AssetMoneyField onChange** signature is `(value: number | undefined) => void` (already parsed). Save on `onBlur` after the field's internal normalization.
- **propertyContext.apiPath** = `'real-estate/property'` (in `frontend/src/lib/asset-contexts.ts:17`). Reuse it instead of hard-coding the path.
- **Address shape** (TypeScript): `{ id: number, street?: string, postalCode?: string, city?: string, district?: string }` — see `Property.address` in `frontend/src/types/entities.ts`. When patching one address field, spread the existing address to keep other fields intact.

---

## Task 1: i18n keys (foundation)

**Files:**
- Modify: `frontend/src/translations/property/en.ts`
- Modify: `frontend/src/translations/property/fi.ts`
- Modify: `frontend/src/translations/property/sv.ts`

- [ ] **Step 1.1: Add keys to en.ts**

Find the property keys block (alphabetically) and add (or merge with existing block):

```ts
// In en.ts, inside the `property` object, alongside existing keys
editSection: 'Edit section',
doneEditing: 'Done',
saveError: 'Failed to save changes',
street: 'Street',
notSet: '—',
```

If a key already exists with a similar meaning, leave it alone — only add the missing ones (`editSection`, `doneEditing`, `saveError`, `street`, `notSet` are new).

- [ ] **Step 1.2: Add keys to fi.ts**

```ts
editSection: 'Muokkaa osiota',
doneEditing: 'Valmis',
saveError: 'Tallennus epäonnistui',
street: 'Katu',
notSet: '—',
```

- [ ] **Step 1.3: Add keys to sv.ts**

```ts
editSection: 'Redigera sektion',
doneEditing: 'Klar',
saveError: 'Sparandet misslyckades',
street: 'Gata',
notSet: '—',
```

- [ ] **Step 1.4: Run translation coverage test**

```bash
cd frontend && npm test -- translations.test.ts
```

Expected: PASS (no missing keys across en/fi/sv).

- [ ] **Step 1.5: Commit**

```bash
git add frontend/src/translations/property/en.ts \
        frontend/src/translations/property/fi.ts \
        frontend/src/translations/property/sv.ts
git commit -m "i18n: add edit-section keys for property view"
```

---

## Task 2: `usePropertyFieldSave` hook

**Files:**
- Create: `frontend/src/components/property/shared/usePropertyFieldSave.ts`
- Create: `frontend/src/components/property/shared/usePropertyFieldSave.test.ts`

- [ ] **Step 2.1: Write the failing tests**

Create `frontend/src/components/property/shared/usePropertyFieldSave.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import ApiClient from '@asset-lib/api-client';
import { AssetToastProvider } from '../../asset';
import { createMockProperty } from '@test-utils/test-data';
import { usePropertyFieldSave } from './usePropertyFieldSave';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AssetToastProvider>{children}</AssetToastProvider>
);

describe('usePropertyFieldSave', () => {
  let putSpy: jest.SpyInstance;

  beforeEach(() => {
    putSpy = jest.spyOn(ApiClient, 'put');
  });

  afterEach(() => {
    putSpy.mockRestore();
  });

  it('PUTs the full property merged with a top-level patch', async () => {
    const property = createMockProperty({ id: 7, name: 'Foo', size: 50, buildYear: 2010 });
    const onUpdated = jest.fn();
    const updated = { ...property, size: 75 };
    putSpy.mockResolvedValueOnce(updated);

    const { result } = renderHook(
      () => usePropertyFieldSave(property, onUpdated),
      { wrapper }
    );

    await act(async () => {
      await result.current({ size: 75 });
    });

    expect(putSpy).toHaveBeenCalledWith(
      'real-estate/property',
      7,
      expect.objectContaining({ name: 'Foo', size: 75, buildYear: 2010 })
    );
    expect(onUpdated).toHaveBeenCalledWith(updated);
  });

  it('merges nested address patches with existing address', async () => {
    const property = createMockProperty({
      id: 8,
      address: { id: 1, street: 'Old', city: 'Helsinki', postalCode: '00100' },
    });
    putSpy.mockResolvedValueOnce(property);

    const { result } = renderHook(
      () => usePropertyFieldSave(property, jest.fn()),
      { wrapper }
    );

    await act(async () => {
      await result.current({ address: { street: 'New' } as never });
    });

    expect(putSpy).toHaveBeenCalledWith(
      'real-estate/property',
      8,
      expect.objectContaining({
        address: expect.objectContaining({
          id: 1,
          street: 'New',
          city: 'Helsinki',
          postalCode: '00100',
        }),
      })
    );
  });

  it('rethrows on error and does not call onUpdated', async () => {
    const property = createMockProperty({ id: 9 });
    const onUpdated = jest.fn();
    putSpy.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(
      () => usePropertyFieldSave(property, onUpdated),
      { wrapper }
    );

    await expect(
      act(async () => {
        await result.current({ size: 60 });
      })
    ).rejects.toThrow('boom');

    expect(onUpdated).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2.2: Run test, expect fail**

```bash
cd frontend && npm test -- usePropertyFieldSave
```

Expected: FAIL with "Cannot find module './usePropertyFieldSave'".

- [ ] **Step 2.3: Implement the hook**

Create `frontend/src/components/property/shared/usePropertyFieldSave.ts`:

```ts
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ApiClient from '@asset-lib/api-client';
import { propertyContext } from '@asset-lib/asset-contexts';
import { Property } from '@asset-types';
import { useToast } from '../../asset';

export type PropertyFieldPatch = Partial<Property>;

export type SaveField = (patch: PropertyFieldPatch) => Promise<void>;

export function usePropertyFieldSave(
  property: Property,
  onPropertyUpdated: (updated: Property) => void
): SaveField {
  const { t } = useTranslation('property');
  const { showToast } = useToast();

  return useCallback(
    async (patch: PropertyFieldPatch) => {
      const merged: Property = {
        ...property,
        ...patch,
        address: patch.address
          ? { ...(property.address ?? {}), ...patch.address }
          : property.address,
      } as Property;

      try {
        const updated = await ApiClient.put<Property>(
          propertyContext.apiPath,
          property.id,
          merged
        );
        onPropertyUpdated(updated);
      } catch (err) {
        showToast({ message: t('saveError'), severity: 'error' });
        throw err;
      }
    },
    [property, onPropertyUpdated, showToast, t]
  );
}
```

> Verify the toast call signature in `frontend/src/components/asset/toast/AssetToastProvider.tsx` before running tests — if `showToast` takes `({ message, severity })` instead of `(message, severity)`, adjust the call accordingly. Same applies to the `useToast` import path.

- [ ] **Step 2.4: Run tests, expect pass**

```bash
cd frontend && npm test -- usePropertyFieldSave
```

Expected: 3 PASS.

- [ ] **Step 2.5: Commit**

```bash
git add frontend/src/components/property/shared/usePropertyFieldSave.ts \
        frontend/src/components/property/shared/usePropertyFieldSave.test.ts
git commit -m "feat(property): add usePropertyFieldSave hook"
```

---

## Task 3: `useEditableSection` hook

**Files:**
- Create: `frontend/src/components/property/shared/useEditableSection.ts`

(No separate unit test — covered by integration tests in Task 5/6.)

- [ ] **Step 3.1: Implement the hook**

Create `frontend/src/components/property/shared/useEditableSection.ts`:

```ts
import { useCallback } from 'react';

export interface EditableSectionState {
  editing: boolean;
  toggle: () => void;
}

export function useEditableSection(
  activeKey: string | null,
  setActiveKey: (key: string | null) => void,
  sectionKey: string
): EditableSectionState {
  const editing = activeKey === sectionKey;
  const toggle = useCallback(() => {
    setActiveKey(editing ? null : sectionKey);
  }, [editing, sectionKey, setActiveKey]);

  return { editing, toggle };
}
```

- [ ] **Step 3.2: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors related to this file (existing unrelated errors are out of scope).

- [ ] **Step 3.3: Commit**

```bash
git add frontend/src/components/property/shared/useEditableSection.ts
git commit -m "feat(property): add useEditableSection lock hook"
```

---

## Task 4: `EditableDetailRow` — read mode

**Files:**
- Create: `frontend/src/components/property/shared/EditableDetailRow.tsx`
- Create: `frontend/src/components/property/shared/EditableDetailRow.test.tsx`

- [ ] **Step 4.1: Write the failing read-mode test**

Create `frontend/src/components/property/shared/EditableDetailRow.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import EditableDetailRow from './EditableDetailRow';

describe('EditableDetailRow (read mode)', () => {
  it('renders label and value as a DetailRow when not editing', () => {
    renderWithProviders(
      <EditableDetailRow
        label="Size"
        value={45}
        editing={false}
        inputType="number"
        onSave={jest.fn()}
        format={(v) => `${v} m²`}
      />
    );

    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('45 m²')).toBeInTheDocument();
  });

  it('falls back to notSetLabel when value is empty', () => {
    renderWithProviders(
      <EditableDetailRow
        label="District"
        value={null}
        editing={false}
        inputType="text"
        onSave={jest.fn()}
        notSetLabel="—"
      />
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4.2: Run test, expect fail**

```bash
cd frontend && npm test -- EditableDetailRow
```

Expected: FAIL — module not found.

- [ ] **Step 4.3: Implement read mode only**

Create `frontend/src/components/property/shared/EditableDetailRow.tsx`:

```tsx
import { ReactNode } from 'react';
import DetailRow from './DetailRow';

export type EditableInputType = 'text' | 'number' | 'currency' | 'date' | 'multiline';

export interface EditableDetailRowProps {
  icon?: ReactNode;
  label: string;
  value: string | number | Date | null | undefined;
  editing: boolean;
  inputType: EditableInputType;
  onSave: (newValue: string | number | Date | null | undefined) => Promise<void> | void;
  format?: (value: string | number | Date | null | undefined) => ReactNode;
  notSetLabel?: string;
  min?: number;
  max?: number;
  rows?: number;
  maxRows?: number;
  autoFocus?: boolean;
}

function isEmpty(value: EditableDetailRowProps['value']): boolean {
  return value === null || value === undefined || value === '';
}

function EditableDetailRow(props: EditableDetailRowProps) {
  if (!props.editing) {
    const display = isEmpty(props.value)
      ? (props.notSetLabel ?? '—')
      : (props.format ? props.format(props.value) : String(props.value));
    return <DetailRow icon={props.icon} label={props.label} value={display} />;
  }

  // Edit modes implemented in subsequent tasks.
  return <DetailRow icon={props.icon} label={props.label} value={String(props.value ?? '')} />;
}

export default EditableDetailRow;
```

- [ ] **Step 4.4: Run test, expect pass**

```bash
cd frontend && npm test -- EditableDetailRow
```

Expected: 2 PASS.

- [ ] **Step 4.5: Commit**

```bash
git add frontend/src/components/property/shared/EditableDetailRow.tsx \
        frontend/src/components/property/shared/EditableDetailRow.test.tsx
git commit -m "feat(property): add EditableDetailRow read mode"
```

---

## Task 5: `EditableDetailRow` — text edit mode (with Enter/Esc/blur)

**Files:**
- Modify: `frontend/src/components/property/shared/EditableDetailRow.tsx`
- Modify: `frontend/src/components/property/shared/EditableDetailRow.test.tsx`

- [ ] **Step 5.1: Add failing tests for text edit mode**

Append to `EditableDetailRow.test.tsx`:

```tsx
import userEvent from '@testing-library/user-event';

describe('EditableDetailRow (text edit mode)', () => {
  it('renders a TextField in edit mode prefilled with the value', () => {
    renderWithProviders(
      <EditableDetailRow
        label="Street"
        value="Old street"
        editing
        inputType="text"
        onSave={jest.fn()}
      />
    );
    expect(screen.getByLabelText('Street')).toHaveValue('Old street');
  });

  it('saves on blur with the new value', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <EditableDetailRow
        label="Street"
        value="Old"
        editing
        inputType="text"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Street');
    await user.clear(input);
    await user.type(input, 'New');
    await user.tab();

    expect(onSave).toHaveBeenCalledWith('New');
  });

  it('saves on Enter and does not save again on the resulting blur', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <EditableDetailRow
        label="Street"
        value="Old"
        editing
        inputType="text"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Street');
    await user.clear(input);
    await user.type(input, 'New{Enter}');

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('New');
  });

  it('reverts on Escape and does not save', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();

    renderWithProviders(
      <EditableDetailRow
        label="Street"
        value="Old"
        editing
        inputType="text"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Street');
    await user.clear(input);
    await user.type(input, 'New{Escape}');

    expect(onSave).not.toHaveBeenCalled();
    expect(input).toHaveValue('Old');
  });

  it('reverts to original value when onSave rejects', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockRejectedValue(new Error('fail'));

    renderWithProviders(
      <EditableDetailRow
        label="Street"
        value="Old"
        editing
        inputType="text"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Street');
    await user.clear(input);
    await user.type(input, 'New');
    await user.tab();

    // After rejected save, input value should restore to "Old"
    expect(input).toHaveValue('Old');
  });
});
```

- [ ] **Step 5.2: Run tests, expect fail**

```bash
cd frontend && npm test -- EditableDetailRow
```

Expected: FAIL on the new edit-mode tests (input not found / value not updated / save not called).

- [ ] **Step 5.3: Implement text edit mode**

Replace the contents of `EditableDetailRow.tsx`:

```tsx
import { Box, Stack, Typography } from '@mui/material';
import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';
import AssetTextField from '../../asset/form/AssetTextField';
import DetailRow from './DetailRow';

export type EditableInputType = 'text' | 'number' | 'currency' | 'date' | 'multiline';

export interface EditableDetailRowProps {
  icon?: ReactNode;
  label: string;
  value: string | number | Date | null | undefined;
  editing: boolean;
  inputType: EditableInputType;
  onSave: (newValue: string | number | Date | null | undefined) => Promise<void> | void;
  format?: (value: EditableDetailRowProps['value']) => ReactNode;
  notSetLabel?: string;
  min?: number;
  max?: number;
  rows?: number;
  maxRows?: number;
  autoFocus?: boolean;
}

function isEmpty(value: EditableDetailRowProps['value']): boolean {
  return value === null || value === undefined || value === '';
}

function EditableDetailRow(props: EditableDetailRowProps) {
  const initial = props.value ?? '';
  const [draft, setDraft] = useState<string>(String(initial));
  const lastCommittedRef = useRef<string>(String(initial));
  const escPressedRef = useRef<boolean>(false);

  // Sync local draft when external value changes (e.g., after save) or when entering edit mode.
  useEffect(() => {
    const next = String(props.value ?? '');
    setDraft(next);
    lastCommittedRef.current = next;
  }, [props.value, props.editing]);

  if (!props.editing) {
    const display = isEmpty(props.value)
      ? (props.notSetLabel ?? '—')
      : (props.format ? props.format(props.value) : String(props.value));
    return <DetailRow icon={props.icon} label={props.label} value={display} />;
  }

  const commit = async (raw: string) => {
    if (raw === lastCommittedRef.current) {
      return;
    }
    const previous = lastCommittedRef.current;
    lastCommittedRef.current = raw;
    try {
      await props.onSave(raw === '' ? null : raw);
    } catch {
      // Revert on failure (toast is shown by usePropertyFieldSave)
      lastCommittedRef.current = previous;
      setDraft(previous);
    }
  };

  const handleBlur = () => {
    if (escPressedRef.current) {
      escPressedRef.current = false;
      return;
    }
    void commit(draft);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && props.inputType !== 'multiline') {
      e.preventDefault();
      void commit(draft);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      escPressedRef.current = true;
      setDraft(lastCommittedRef.current);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }} onKeyDown={handleKeyDown}>
      {props.icon && (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 1.5, minWidth: 20 }}>
          {props.icon}
        </Box>
      )}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 120, fontSize: '0.75rem' }}>
          {props.label}
        </Typography>
        <Box sx={{ flex: 1 }}>
          <AssetTextField
            label={props.label}
            value={draft}
            multiline={props.inputType === 'multiline'}
            rows={props.inputType === 'multiline' ? (props.rows ?? 4) : undefined}
            autoFocus={props.autoFocus !== false}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
          />
        </Box>
      </Stack>
    </Box>
  );
}

export default EditableDetailRow;
```

- [ ] **Step 5.4: Run tests, expect pass**

```bash
cd frontend && npm test -- EditableDetailRow
```

Expected: all tests PASS (read mode + text edit mode).

- [ ] **Step 5.5: Commit**

```bash
git add frontend/src/components/property/shared/EditableDetailRow.tsx \
        frontend/src/components/property/shared/EditableDetailRow.test.tsx
git commit -m "feat(property): add text edit mode with Enter/Esc/blur to EditableDetailRow"
```

---

## Task 6: `EditableDetailRow` — number, currency, multiline, date edit modes

**Files:**
- Modify: `frontend/src/components/property/shared/EditableDetailRow.tsx`
- Modify: `frontend/src/components/property/shared/EditableDetailRow.test.tsx`

- [ ] **Step 6.1: Add failing tests for number/currency/date/multiline**

Append to `EditableDetailRow.test.tsx`:

```tsx
describe('EditableDetailRow (number edit mode)', () => {
  it('saves number on blur', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <EditableDetailRow
        label="Size"
        value={45}
        editing
        inputType="number"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Size');
    await user.clear(input);
    await user.type(input, '50');
    await user.tab();

    expect(onSave).toHaveBeenCalledWith(50);
  });

  it('treats cleared number as null', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <EditableDetailRow
        label="Build year"
        value={2010}
        editing
        inputType="number"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Build year');
    await user.clear(input);
    await user.tab();

    expect(onSave).toHaveBeenCalledWith(null);
  });
});

describe('EditableDetailRow (currency edit mode)', () => {
  it('saves parsed money on blur', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <EditableDetailRow
        label="Purchase loan"
        value={150000}
        editing
        inputType="currency"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Purchase loan');
    await user.clear(input);
    await user.type(input, '160000');
    await user.tab();

    expect(onSave).toHaveBeenCalledWith(160000);
  });
});

describe('EditableDetailRow (multiline edit mode)', () => {
  it('does not save on Enter (newline allowed)', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <EditableDetailRow
        label="Description"
        value="line one"
        editing
        inputType="multiline"
        rows={4}
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Description');
    await user.click(input);
    await user.keyboard('{Enter}line two');

    expect(onSave).not.toHaveBeenCalled();
    expect(input).toHaveValue('line one\nline two');
  });

  it('saves multiline on blur', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <EditableDetailRow
        label="Description"
        value=""
        editing
        inputType="multiline"
        rows={4}
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Description');
    await user.type(input, 'a{Enter}b');
    await user.tab();

    expect(onSave).toHaveBeenCalledWith('a\nb');
  });
});

describe('EditableDetailRow (date edit mode)', () => {
  it('saves on date selection', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <EditableDetailRow
        label="Purchase date"
        value={new Date('2020-01-01')}
        editing
        inputType="date"
        onSave={onSave}
      />
    );

    // AssetDatePicker exposes the input by label
    const input = screen.getByLabelText('Purchase date');
    await user.clear(input);
    await user.type(input, '06/15/2020');
    await user.tab();

    expect(onSave).toHaveBeenCalled();
    const arg = onSave.mock.calls[0][0] as Date;
    expect(arg).toBeInstanceOf(Date);
    expect(arg.getFullYear()).toBe(2020);
    expect(arg.getMonth()).toBe(5); // June
    expect(arg.getDate()).toBe(15);
  });
});
```

> Note: AssetDatePicker uses dayjs adapter; the input format depends on locale. Adjust the typed string in the date test to match what `i18n` initializes in `frontend/test/utils/test-i18n.ts`. If the date input format isn't predictable, replace this test with a direct `onChange(dayjs('2020-06-15'))` driven via `fireEvent.change` on the underlying input, or assert via the picker's calendar role buttons.

- [ ] **Step 6.2: Run tests, expect fail**

```bash
cd frontend && npm test -- EditableDetailRow
```

Expected: number/currency/date tests FAIL because the implementation only renders an `AssetTextField`. Multiline newline test should already pass (Enter is suppressed only for non-multiline) but the blur-save assertion may fail until inputs are correctly wired.

- [ ] **Step 6.3: Implement number / currency / multiline / date edit modes**

Update `EditableDetailRow.tsx` to switch on `inputType`. Replace the edit-mode return block with:

```tsx
  // ... (commit, handleBlur, handleKeyDown unchanged from Task 5)

  const renderInput = () => {
    switch (props.inputType) {
      case 'number': {
        const numericValue: number | '' = draft === '' ? '' : Number(draft);
        return (
          <AssetNumberField
            label={props.label}
            value={Number.isNaN(numericValue) ? '' : numericValue}
            autoFocus={props.autoFocus !== false}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (escPressedRef.current) { escPressedRef.current = false; return; }
              if (draft === '') {
                if (lastCommittedRef.current === '') return;
                lastCommittedRef.current = '';
                void (async () => {
                  try { await props.onSave(null); } catch { /* revert handled below */ }
                })();
                return;
              }
              const parsed = Number(draft);
              if (Number.isNaN(parsed)) return;
              if (String(parsed) === lastCommittedRef.current) return;
              const previous = lastCommittedRef.current;
              lastCommittedRef.current = String(parsed);
              void (async () => {
                try { await props.onSave(parsed); }
                catch { lastCommittedRef.current = previous; setDraft(previous); }
              })();
            }}
          />
        );
      }
      case 'currency': {
        const moneyValue: number | '' = draft === '' ? '' : Number(draft);
        return (
          <AssetMoneyField
            label={props.label}
            value={Number.isNaN(moneyValue) ? '' : moneyValue}
            autoFocus={props.autoFocus !== false}
            onChange={(v) => setDraft(v === undefined ? '' : String(v))}
            onBlur={() => {
              if (escPressedRef.current) { escPressedRef.current = false; return; }
              const next = draft === '' ? null : Number(draft);
              if (next !== null && Number.isNaN(next)) return;
              const nextStr = next === null ? '' : String(next);
              if (nextStr === lastCommittedRef.current) return;
              const previous = lastCommittedRef.current;
              lastCommittedRef.current = nextStr;
              void (async () => {
                try { await props.onSave(next); }
                catch { lastCommittedRef.current = previous; setDraft(previous); }
              })();
            }}
          />
        );
      }
      case 'date': {
        const dateValue = props.value instanceof Date ? props.value : null;
        return (
          <AssetDatePicker
            label={props.label}
            value={dateValue}
            autoFocus={props.autoFocus !== false}
            onChange={(value) => {
              const next = value ? value.toDate() : null;
              const nextIso = next ? next.toISOString() : '';
              if (nextIso === lastCommittedRef.current) return;
              const previous = lastCommittedRef.current;
              lastCommittedRef.current = nextIso;
              void (async () => {
                try { await props.onSave(next); }
                catch { lastCommittedRef.current = previous; }
              })();
            }}
          />
        );
      }
      case 'multiline':
      case 'text':
      default:
        return (
          <AssetTextField
            label={props.label}
            value={draft}
            multiline={props.inputType === 'multiline'}
            rows={props.inputType === 'multiline' ? (props.rows ?? 4) : undefined}
            autoFocus={props.autoFocus !== false}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
          />
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }} onKeyDown={handleKeyDown}>
      {props.icon && (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 1.5, minWidth: 20 }}>
          {props.icon}
        </Box>
      )}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 120, fontSize: '0.75rem' }}>
          {props.label}
        </Typography>
        <Box sx={{ flex: 1 }}>{renderInput()}</Box>
      </Stack>
    </Box>
  );
```

Add the imports at the top:

```tsx
import AssetNumberField from '../../asset/form/AssetNumberField';
import AssetMoneyField from '../../asset/form/AssetMoneyField';
import AssetDatePicker from '../../asset/form/AssetDatePicker';
```

- [ ] **Step 6.4: Run tests, expect pass**

```bash
cd frontend && npm test -- EditableDetailRow
```

Expected: all 12+ tests PASS. If the date test fails because of locale-dependent date formatting, switch the test approach to `fireEvent.change` on the date input or assert via calendar buttons (see note in Step 6.1).

- [ ] **Step 6.5: Commit**

```bash
git add frontend/src/components/property/shared/EditableDetailRow.tsx \
        frontend/src/components/property/shared/EditableDetailRow.test.tsx
git commit -m "feat(property): add number, currency, date and multiline edit modes"
```

---

## Task 7: Wire `PropertyInfoSection` (Property Info + Location cards)

**Files:**
- Modify: `frontend/src/components/property/sections/PropertyInfoSection.tsx`
- Modify: `frontend/src/components/property/sections/PropertyInfoSection.test.tsx`

- [ ] **Step 7.1: Add failing tests for the Property Info card edit flow**

Add to `PropertyInfoSection.test.tsx`:

```tsx
import userEvent from '@testing-library/user-event';
import ApiClient from '@asset-lib/api-client';

describe('PropertyInfoSection edit mode', () => {
  let putSpy: jest.SpyInstance;

  beforeEach(() => {
    putSpy = jest.spyOn(ApiClient, 'put');
  });

  afterEach(() => {
    putSpy.mockRestore();
  });

  it('toggles Property Info into edit mode and saves size on blur', async () => {
    const user = userEvent.setup();
    const property = createMockProperty({ id: 11, size: 45, buildYear: 2010, name: 'X' });
    const onUpdated = jest.fn();
    let activeKey: string | null = null;
    const setActiveKey = jest.fn((k: string | null) => { activeKey = k; });

    putSpy.mockResolvedValueOnce({ ...property, size: 60 });

    const { rerender } = renderWithProviders(
      <PropertyInfoSection
        property={property}
        activeKey={activeKey}
        setActiveKey={setActiveKey}
        onPropertyUpdated={onUpdated}
      />
    );

    // Click pencil for property-info card
    const pencil = screen.getByRole('button', { name: /edit section/i, hidden: false });
    await user.click(pencil);

    // setActiveKey should have been called; rerender with the new key
    expect(setActiveKey).toHaveBeenCalled();
    rerender(
      <PropertyInfoSection
        property={property}
        activeKey={'property-info'}
        setActiveKey={setActiveKey}
        onPropertyUpdated={onUpdated}
      />
    );

    const sizeInput = screen.getByLabelText('Size');
    await user.clear(sizeInput);
    await user.type(sizeInput, '60');
    await user.tab();

    expect(putSpy).toHaveBeenCalledWith(
      'real-estate/property',
      11,
      expect.objectContaining({ size: 60, name: 'X' })
    );
    expect(onUpdated).toHaveBeenCalled();
  });
});
```

> Note: `PropertyInfoSection` currently takes only `{ property }` as props. The new signature is `{ property, activeKey, setActiveKey, onPropertyUpdated }`. Existing tests will need their props updated; supply default no-op values. Run the existing tests first to see which break and update them in this task.

- [ ] **Step 7.2: Run tests, expect fail**

```bash
cd frontend && npm test -- PropertyInfoSection
```

Expected: TypeScript / runtime errors because pencils are missing on Property Info / Location cards and props don't exist yet.

- [ ] **Step 7.3: Update `PropertyInfoSection` props and add pencils to Property Info + Location**

Modify the component signature and add pencil + edit handlers. Replace the relevant sections of `frontend/src/components/property/sections/PropertyInfoSection.tsx`:

```tsx
// 1. Update imports — add EditableDetailRow, useEditableSection, usePropertyFieldSave
import EditableDetailRow from '../shared/EditableDetailRow';
import { useEditableSection } from '../shared/useEditableSection';
import { usePropertyFieldSave } from '../shared/usePropertyFieldSave';
import { Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';

// 2. Update the props interface
interface PropertyInfoSectionProps {
  property: Property;
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
  onPropertyUpdated: (updated: Property) => void;
}

function PropertyInfoSection({
  property,
  activeKey,
  setActiveKey,
  onPropertyUpdated,
}: PropertyInfoSectionProps) {
  // ... existing useTranslation, currentCharges, etc.

  const saveField = usePropertyFieldSave(property, onPropertyUpdated);

  const propertyInfo = useEditableSection(activeKey, setActiveKey, 'property-info');
  const location = useEditableSection(activeKey, setActiveKey, 'location');
  const purchase = useEditableSection(activeKey, setActiveKey, 'purchase');
  const sale = useEditableSection(activeKey, setActiveKey, 'sale');

  const renderPencil = (section: { editing: boolean; toggle: () => void }) => (
    <Tooltip title={section.editing ? t('doneEditing') : t('editSection')}>
      <IconButton
        size="small"
        onClick={section.toggle}
        aria-label={section.editing ? t('doneEditing') : t('editSection')}
      >
        {section.editing ? <CheckIcon fontSize="small" /> : <EditIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
```

Then replace the Property Info card body to use `EditableDetailRow`:

```tsx
      <Grid size={{ xs: 12, md: 6 }}>
        <PropertyInfoCard title={t('propertyInfo')} action={renderPencil(propertyInfo)}>
          <EditableDetailRow
            icon={<SquareFootIcon fontSize="small" />}
            label={t('size')}
            value={property.size}
            editing={propertyInfo.editing}
            inputType="number"
            min={1}
            max={1000}
            onSave={(v) => saveField({ size: v as number })}
            format={(v) => `${v} m²`}
          />
          <EditableDetailRow
            icon={<CalendarTodayIcon fontSize="small" />}
            label={t('buildYear')}
            value={property.buildYear ?? null}
            editing={propertyInfo.editing}
            inputType="number"
            min={1800}
            max={2100}
            onSave={(v) => saveField({ buildYear: v as number })}
          />
          {pricePerSqm !== null && !propertyInfo.editing && (
            <DetailRow
              icon={<CalculateIcon fontSize="small" />}
              label={t('pricePerSqm')}
              value={formatCurrency(pricePerSqm)}
            />
          )}
        </PropertyInfoCard>
      </Grid>
```

Then replace the Location card to always render (drop the `hasAddress` gate) with editable rows:

```tsx
      <Grid size={{ xs: 12, md: 6 }}>
        <PropertyInfoCard title={t('locationInfo')} action={renderPencil(location)}>
          <EditableDetailRow
            icon={<LocationOnIcon fontSize="small" />}
            label={t('street')}
            value={property.address?.street ?? null}
            editing={location.editing}
            inputType="text"
            onSave={(v) => saveField({ address: { street: (v as string) ?? '' } as never })}
          />
          <EditableDetailRow
            icon={<LocationCityIcon fontSize="small" />}
            label={t('postalCode')}
            value={property.address?.postalCode ?? null}
            editing={location.editing}
            inputType="text"
            onSave={(v) => saveField({ address: { postalCode: (v as string) ?? '' } as never })}
          />
          <EditableDetailRow
            icon={<LocationCityIcon fontSize="small" />}
            label={t('city')}
            value={property.address?.city ?? null}
            editing={location.editing}
            inputType="text"
            onSave={(v) => saveField({ address: { city: (v as string) ?? '' } as never })}
          />
          <EditableDetailRow
            icon={<MapIcon fontSize="small" />}
            label={t('district')}
            value={property.address?.district ?? null}
            editing={location.editing}
            inputType="text"
            onSave={(v) => saveField({ address: { district: (v as string) ?? '' } as never })}
          />
        </PropertyInfoCard>
      </Grid>
```

Leave Monthly Costs card unchanged (its existing dialog pencil stays).

> Now there are TWO pencil icons rendered before the Purchase card update — `getByRole('button', { name: /edit section/i })` will match multiple. Update the test to scope by section title using `within(...)`. Add this import to the test file: `import { within } from '@testing-library/react';` and locate the pencil via `within(screen.getByText('Property Information').closest('div')!).getByRole('button', ...)`.

- [ ] **Step 7.4: Update existing PropertyInfoSection tests for new prop signature**

In `PropertyInfoSection.test.tsx`, every existing `renderWithProviders(<PropertyInfoSection property={...} />)` becomes:

```tsx
renderWithProviders(
  <PropertyInfoSection
    property={property}
    activeKey={null}
    setActiveKey={() => {}}
    onPropertyUpdated={() => {}}
  />
);
```

Update the existing assertion `expect(screen.queryByText(/location/i)).not.toBeInTheDocument()` for the "no address" test — Location is now always rendered, so change it to assert that the section title is present but the rows show `notSet` placeholders.

- [ ] **Step 7.5: Run tests, expect pass**

```bash
cd frontend && npm test -- PropertyInfoSection
```

Expected: all PASS (existing + new edit-mode test).

- [ ] **Step 7.6: Commit**

```bash
git add frontend/src/components/property/sections/PropertyInfoSection.tsx \
        frontend/src/components/property/sections/PropertyInfoSection.test.tsx
git commit -m "feat(property): inline edit for Property Info and Location cards"
```

---

## Task 8: Wire Purchase + Sale cards in `PropertyInfoSection`

**Files:**
- Modify: `frontend/src/components/property/sections/PropertyInfoSection.tsx`
- Modify: `frontend/src/components/property/sections/PropertyInfoSection.test.tsx`

- [ ] **Step 8.1: Add failing tests for Purchase card edit**

Add to `PropertyInfoSection.test.tsx`:

```tsx
it('saves purchase loan inline with currency input', async () => {
  const user = userEvent.setup();
  const property = createMockProperty({
    id: 22, name: 'Y', size: 50,
    status: PropertyStatus.OWN, purchaseLoan: 100000,
  });
  putSpy.mockResolvedValueOnce({ ...property, purchaseLoan: 120000 });

  renderWithProviders(
    <PropertyInfoSection
      property={property}
      activeKey={'purchase'}
      setActiveKey={() => {}}
      onPropertyUpdated={jest.fn()}
    />
  );

  const input = screen.getByLabelText('Purchase Loan');
  await user.clear(input);
  await user.type(input, '120000');
  await user.tab();

  expect(putSpy).toHaveBeenCalledWith(
    'real-estate/property',
    22,
    expect.objectContaining({ purchaseLoan: 120000 })
  );
});

it('renders Purchase card for OWN status even when no purchase data set', () => {
  const property = createMockProperty({
    id: 23, status: PropertyStatus.OWN,
    purchaseDate: undefined, purchaseLoan: undefined,
  });

  renderWithProviders(
    <PropertyInfoSection
      property={property}
      activeKey={null}
      setActiveKey={() => {}}
      onPropertyUpdated={jest.fn()}
    />
  );

  expect(screen.getByText('Purchase Info')).toBeInTheDocument();
});
```

- [ ] **Step 8.2: Run tests, expect fail**

```bash
cd frontend && npm test -- PropertyInfoSection
```

Expected: FAIL — Purchase card is gated by `hasPurchaseDetails`; needs always-render and editable rows.

- [ ] **Step 8.3: Update Purchase + Sale card markup**

Replace the Purchase card block:

```tsx
      {(property.status === PropertyStatus.OWN || property.status === PropertyStatus.SOLD) && (
        <Grid size={{ xs: 12, md: 6 }}>
          <PropertyInfoCard title={t('purchaseInfoSection')} action={renderPencil(purchase)}>
            <EditableDetailRow
              icon={<CalendarTodayIcon fontSize="small" />}
              label={t('purchaseDate')}
              value={property.purchaseDate ?? null}
              editing={purchase.editing}
              inputType="date"
              onSave={(v) => saveField({ purchaseDate: (v as Date) ?? undefined })}
              format={(v) => formatDate(v as Date)}
            />
            <EditableDetailRow
              icon={<AccountBalanceIcon fontSize="small" />}
              label={t('purchaseLoan')}
              value={property.purchaseLoan ?? null}
              editing={purchase.editing}
              inputType="currency"
              onSave={(v) => saveField({ purchaseLoan: (v as number) ?? undefined })}
              format={(v) => formatCurrency(v as number)}
            />
          </PropertyInfoCard>
        </Grid>
      )}
```

Replace the Sale card block:

```tsx
      {property.status === PropertyStatus.SOLD && (
        <Grid size={{ xs: 12, md: 6 }}>
          <PropertyInfoCard title={t('saleInfoSection')} action={renderPencil(sale)}>
            <EditableDetailRow
              icon={<CalendarTodayIcon fontSize="small" />}
              label={t('saleDate')}
              value={property.saleDate ?? null}
              editing={sale.editing}
              inputType="date"
              onSave={(v) => saveField({ saleDate: (v as Date) ?? undefined })}
              format={(v) => formatDate(v as Date)}
            />
          </PropertyInfoCard>
        </Grid>
      )}
```

- [ ] **Step 8.4: Run tests, expect pass**

```bash
cd frontend && npm test -- PropertyInfoSection
```

Expected: all PASS.

- [ ] **Step 8.5: Commit**

```bash
git add frontend/src/components/property/sections/PropertyInfoSection.tsx \
        frontend/src/components/property/sections/PropertyInfoSection.test.tsx
git commit -m "feat(property): inline edit for Purchase and Sale cards"
```

---

## Task 9: Wire `PropertyView` (lock state + Description card)

**Files:**
- Modify: `frontend/src/components/property/PropertyView.tsx`
- Modify: `frontend/src/components/property/PropertyView.test.tsx` (if it exercises Description; else `frontend/test/views/PropertyView.test.tsx`)

- [ ] **Step 9.1: Update test translation mock**

In `frontend/src/components/property/PropertyView.test.tsx`, the `withTranslation` mock provides translations inline (see the `translations: Record<string, string> = { ... }` block near the top). Add the new keys so they render correctly during the test:

```tsx
// Inside the translations object:
editSection: 'Edit section',
doneEditing: 'Done',
saveError: 'Failed to save changes',
street: 'Street',
notSet: '—',
```

- [ ] **Step 9.2: Add failing test for Description edit**

Append to `frontend/src/components/property/PropertyView.test.tsx` (after the existing `describe('PropertyView', ...)` block — inside the same describe, or create a new sibling `describe('PropertyView edit', ...)`).

Mirror the existing fetch setup (the file already mocks `ApiClient.get` to return a property). Find the existing helper that resolves a property (search for `mockResolvedValue` / `mockResolvedValueOnce` near the top of the existing tests), and reuse it:

```tsx
import { within } from '@testing-library/react';

it('saves description inline from the Description card', async () => {
  const user = userEvent.setup();

  const property = createMockProperty({
    id: 1,
    name: 'X',
    size: 50,
    description: 'old description',
  });

  // Match the existing fetch pattern at the top of this file.
  // If existing tests mock ApiClient.get via jest.spyOn, replicate that here:
  const getSpy = jest.spyOn(ApiClient, 'get').mockResolvedValue(property);
  const putSpy = jest.spyOn(ApiClient, 'put').mockResolvedValueOnce({
    ...property,
    description: 'new description',
  });

  renderPropertyView('1', 'own');

  // Wait for property load
  await waitFor(() => expect(screen.getByText('old description')).toBeInTheDocument());

  // Locate the Description card pencil. The Description card title is the
  // localized 'description' key (rendered as 'Description' by the mock above).
  const descCard = screen.getByText('Description').closest('[class*="MuiPaper"], div')!;
  const pencil = within(descCard as HTMLElement).getByRole('button', { name: /edit section/i });
  await user.click(pencil);

  const textarea = screen.getByLabelText('Description');
  await user.clear(textarea);
  await user.type(textarea, 'new description');
  await user.tab();

  await waitFor(() => {
    expect(putSpy).toHaveBeenCalledWith(
      'real-estate/property',
      1,
      expect.objectContaining({ description: 'new description' })
    );
  });

  getSpy.mockRestore();
  putSpy.mockRestore();
});
```

> If the existing tests use `jest.spyOn(axios, 'get')` instead of `jest.spyOn(ApiClient, 'get')`, replicate whatever pattern they use. Inspect `frontend/src/components/property/PropertyView.test.tsx:80–130` for the existing fetch scaffolding and copy it.

- [ ] **Step 9.3: Update `PropertyView.tsx` to own activeKey, pass props down, and edit Description**

In `frontend/src/components/property/PropertyView.tsx`:

1. Add imports at the top:

```tsx
import EditableDetailRow from './shared/EditableDetailRow';
import { useEditableSection } from './shared/useEditableSection';
import { usePropertyFieldSave } from './shared/usePropertyFieldSave';
import { Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
```

2. Add state at the top of the component (alongside existing `useState` calls, **before** the early returns that gate on `loading`/`error`/`!property`):

```tsx
const [activeEditKey, setActiveEditKey] = useState<string | null>(null);
const description = useEditableSection(activeEditKey, setActiveEditKey, 'description');
```

3. Define the save callback after the early returns (where `property` is guaranteed non-null), using `useCallback` with a stable dependency on `property`:

Move the `usePropertyFieldSave` invocation **inside the JSX render** by extracting the Description card into a small inline component, OR — simpler — leave the early returns (`if (loading) ...`, `if (error || !property) ...`) in place and call `usePropertyFieldSave` immediately after them. **Hooks must run unconditionally** — to satisfy the rules of hooks, restructure the early returns so that `usePropertyFieldSave` is called above them, like this:

```tsx
// Replace the existing early returns and subsequent render with a single
// render path. Use a fallback empty Property only to satisfy the hook signature
// when loading; the JSX still short-circuits on loading/error.

const safeProperty: Property = property ?? ({ id: 0, name: '', size: 0 } as Property);
const saveDescription = usePropertyFieldSave(safeProperty, (updated) => setProperty(updated));

if (loading) {
  return (
    <Paper sx={{ p: 2 }}>
      <AssetLoadingProgress />
    </Paper>
  );
}

if (error || !property) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography color="error">{error || 'Property not found'}</Typography>
    </Paper>
  );
}
```

This way `usePropertyFieldSave` is always called in the same order on every render. The fallback `safeProperty` is only ever used during the loading guard — once `property` is defined, the closure captures the real one.

4. Update the `PropertyInfoSection` render call (in the existing JSX):

```tsx
<PropertyInfoSection
  property={property}
  activeKey={activeEditKey}
  setActiveKey={setActiveEditKey}
  onPropertyUpdated={setProperty}
/>
```

5. Replace the Description card block. Always render (remove `{property.description && ...}` guard).

```tsx
{/* Description Card — always rendered so users can add a description */}
<Box sx={{ px: 2, py: 1.5 }}>
  <Grid container>
    <Grid size={{ xs: 12 }}>
      <PropertyInfoCard
        title={t('description')}
        action={
          <Tooltip title={description.editing ? t('doneEditing') : t('editSection')}>
            <IconButton
              size="small"
              onClick={description.toggle}
              aria-label={description.editing ? t('doneEditing') : t('editSection')}
            >
              {description.editing ? <CheckIcon fontSize="small" /> : <EditIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        }
      >
        <EditableDetailRow
          label={t('description')}
          value={property.description ?? ''}
          editing={description.editing}
          inputType="multiline"
          rows={4}
          onSave={(v) => saveDescription({ description: (v as string) ?? '' })}
        />
      </PropertyInfoCard>
    </Grid>
  </Grid>
</Box>
```

- [ ] **Step 9.4: Run tests, expect pass**

```bash
cd frontend && npm test -- PropertyView
```

Expected: PASS.

- [ ] **Step 9.5: Commit**

```bash
git add frontend/src/components/property/PropertyView.tsx \
        frontend/src/components/property/PropertyView.test.tsx
git commit -m "feat(property): inline edit for description; lift edit lock to PropertyView"
```

---

## Task 10: Single-section lock integration test

**Files:**
- Modify: `frontend/src/components/property/sections/PropertyInfoSection.test.tsx`

- [ ] **Step 10.1: Add lock test**

Append:

```tsx
it('switches active section when clicking a different pencil', async () => {
  const user = userEvent.setup();
  const property = createMockProperty({
    id: 33, status: PropertyStatus.OWN,
    purchaseLoan: 100000, purchaseDate: new Date('2020-01-01'),
  });

  let activeKey: string | null = null;
  const setActiveKey = jest.fn((k: string | null) => { activeKey = k; });

  const { rerender } = renderWithProviders(
    <PropertyInfoSection
      property={property}
      activeKey={activeKey}
      setActiveKey={setActiveKey}
      onPropertyUpdated={jest.fn()}
    />
  );

  const propertyInfoCard = screen.getByText('Property Information').closest('div')!;
  const purchaseCard = screen.getByText('Purchase Info').closest('div')!;

  await user.click(within(propertyInfoCard).getByRole('button', { name: /edit section/i }));
  expect(setActiveKey).toHaveBeenLastCalledWith('property-info');

  rerender(
    <PropertyInfoSection
      property={property}
      activeKey={'property-info'}
      setActiveKey={setActiveKey}
      onPropertyUpdated={jest.fn()}
    />
  );

  await user.click(within(purchaseCard).getByRole('button', { name: /edit section/i }));
  expect(setActiveKey).toHaveBeenLastCalledWith('purchase');
});
```

- [ ] **Step 10.2: Run, expect pass**

```bash
cd frontend && npm test -- PropertyInfoSection
```

Expected: PASS (no implementation change needed — `useEditableSection` already enforces this).

- [ ] **Step 10.3: Commit**

```bash
git add frontend/src/components/property/sections/PropertyInfoSection.test.tsx
git commit -m "test(property): verify single-section edit lock"
```

---

## Task 11: Verification — full suite + lint + manual smoke test

**Files:** none modified.

- [ ] **Step 11.1: Run full frontend test suite**

```bash
cd frontend && npm test
```

Expected: all tests PASS, including translation coverage.

- [ ] **Step 11.2: Run lint**

```bash
cd frontend && npm run lint
```

Expected: no new errors.

- [ ] **Step 11.3: Run build (type-checks)**

```bash
cd frontend && npm run build
```

Expected: build succeeds.

- [ ] **Step 11.4: Manual smoke test**

Start the dev server and exercise each section:

```bash
cd frontend && npm run dev
```

Open `http://localhost:8080/app/portfolio/prospects/<id>` for a PROSPECT property, then `http://localhost:8080/app/portfolio/own/<id>` for an OWN, and `.../sold/<id>` for a SOLD.

For each section card:
1. Click pencil → inputs appear, prefilled.
2. Change a value → blur → row updates with new value (no page reload), no console errors.
3. Re-edit a different field in same section → also saves.
4. Click another section's pencil → first section exits edit mode automatically.
5. Click a value, hit Esc → reverts.
6. Force a 400 (e.g., size > 1000) and confirm the toast appears and the row reverts.

Verify Description card edit shows a multi-line text area and saves on blur.

- [ ] **Step 11.5: Final commit (only if anything was tweaked during smoke test)**

```bash
git status
# If clean, no commit needed.
# If changes: stage and commit with a focused message.
```

---

## Out of scope (do not implement)

- Monthly Costs section (keeps existing dialog).
- KPI cards (computed values).
- Photo, status, ownerships, apartmentType, rooms (managed in the dedicated edit form).
- Backend changes (the existing `PUT /api/real-estate/property/:id` is sufficient).
- Mobile-specific layout polish.
