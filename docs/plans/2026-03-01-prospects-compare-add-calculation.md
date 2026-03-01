# Prospects Compare Add Calculation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to create investment calculations for apartments directly from the prospects compare view.

**Architecture:** Modify `ProspectCompareView` to fetch both prospects and calculations, display all prospects grouped with their calculations (including those without calculations), and reuse the existing `InvestmentAddDialog` component for the add form.

**Tech Stack:** React, TypeScript, MUI, Jest, MSW

---

## Task 1: Add failing test for fetching prospects

**Files:**
- Modify: `frontend/src/components/investment-calculator/ProspectCompareView.test.tsx`

**Step 1: Write the failing test**

Add this test to the "Displaying Calculations" describe block:

```typescript
it('fetches prospect properties on mount', async () => {
  mockSearch.mockResolvedValue([]);

  renderWithProviders(<ProspectCompareView />);

  await waitFor(() => {
    expect(mockSearch).toHaveBeenCalledWith(
      'real-estate/property/search',
      expect.objectContaining({
        where: { status: PropertyStatus.PROSPECT },
      })
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView" --testNamePattern="fetches prospect properties"`
Expected: FAIL - no call made for property search

**Step 3: Commit failing test**

```bash
git add frontend/src/components/investment-calculator/ProspectCompareView.test.tsx
git commit -m "$(cat <<'EOF'
test: add failing test for fetching prospects in compare view
EOF
)"
```

---

## Task 2: Implement prospects fetching

**Files:**
- Modify: `frontend/src/components/investment-calculator/ProspectCompareView.tsx:46-65`

**Step 1: Add prospects state and fetch**

Add imports at top:
```typescript
import { PropertyStatus } from '@asset-types/common';
```

Add state after existing states (around line 44):
```typescript
const [prospects, setProspects] = useState<Property[]>([]);
```

Modify `fetchCalculations` to also fetch prospects:
```typescript
const fetchCalculations = useCallback(async () => {
  setLoading(true);
  setError(false);
  try {
    const [calculationsData, prospectsData] = await Promise.all([
      ApiClient.search<CalculationWithProperty>('real-estate/investment', {
        relations: { property: { address: true } },
        order: { name: 'ASC' },
      }),
      ApiClient.search<Property>('real-estate/property/search', {
        where: { status: PropertyStatus.PROSPECT },
        relations: { address: true },
        order: { name: 'ASC' },
      }),
    ]);
    setCalculations(calculationsData);
    setProspects(prospectsData);
  } catch (err) {
    console.error('Failed to fetch data:', err);
    setError(true);
  } finally {
    setLoading(false);
  }
}, []);
```

**Step 2: Run test to verify it passes**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView" --testNamePattern="fetches prospect properties"`
Expected: PASS

**Step 3: Run all tests to check for regressions**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView"`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add frontend/src/components/investment-calculator/ProspectCompareView.tsx
git commit -m "$(cat <<'EOF'
feat: fetch prospect properties in compare view
EOF
)"
```

---

## Task 3: Add failing test for showing prospects without calculations

**Files:**
- Modify: `frontend/src/components/investment-calculator/ProspectCompareView.test.tsx`

**Step 1: Update mock setup to support multiple search endpoints**

Replace the `beforeEach` block:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  mockSearch = jest.spyOn(ApiClient, 'search').mockImplementation(
    async (endpoint: string) => {
      if (endpoint === 'real-estate/investment') {
        return [];
      }
      if (endpoint === 'real-estate/property/search') {
        return [];
      }
      return [];
    }
  );
});
```

Add helper function after `createMockProperty`:
```typescript
const setupMocks = (options: {
  calculations?: object[];
  prospects?: object[];
}) => {
  mockSearch.mockImplementation(async (endpoint: string) => {
    if (endpoint === 'real-estate/investment') {
      return options.calculations ?? [];
    }
    if (endpoint === 'real-estate/property/search') {
      return options.prospects ?? [];
    }
    return [];
  });
};
```

**Step 2: Write the failing test**

Add to the "Displaying Calculations" describe block:
```typescript
it('shows prospects without calculations', async () => {
  const prospect = createMockProperty({
    id: 99,
    name: 'Empty Prospect',
    address: { street: 'Empty Street 1', city: 'Helsinki', postalCode: '00100' },
  });
  setupMocks({ calculations: [], prospects: [prospect] });

  renderWithProviders(<ProspectCompareView />);

  await waitFor(() => {
    expect(screen.getByText('Empty Prospect')).toBeInTheDocument();
  });
});
```

**Step 3: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView" --testNamePattern="shows prospects without calculations"`
Expected: FAIL - prospect not displayed

**Step 4: Commit failing test**

```bash
git add frontend/src/components/investment-calculator/ProspectCompareView.test.tsx
git commit -m "$(cat <<'EOF'
test: add failing test for showing prospects without calculations
EOF
)"
```

---

## Task 4: Implement showing all prospects grouped with calculations

**Files:**
- Modify: `frontend/src/components/investment-calculator/ProspectCompareView.tsx:103-120`

**Step 1: Update groupedCalculations memo**

Replace the existing `groupedCalculations` memo:
```typescript
// Group calculations by property AND include all prospects
const groupedByProperty = React.useMemo(() => {
  // Start with all prospects
  const propertyMap = new Map<number, { property: Property; calculations: CalculationWithProperty[] }>();

  // Add all prospects to the map
  prospects.forEach((property) => {
    propertyMap.set(property.id, { property, calculations: [] });
  });

  // Group calculations by property
  const unlinked: CalculationWithProperty[] = [];
  calculations.forEach((calc) => {
    if (calc.propertyId && propertyMap.has(calc.propertyId)) {
      propertyMap.get(calc.propertyId)!.calculations.push(calc);
    } else if (calc.propertyId && calc.property) {
      // Property exists but wasn't in prospects list (e.g., OWN status)
      propertyMap.set(calc.propertyId, { property: calc.property, calculations: [calc] });
    } else {
      unlinked.push(calc);
    }
  });

  return {
    properties: Array.from(propertyMap.values()),
    unlinked,
  };
}, [calculations, prospects]);
```

**Step 2: Update JSX to use new structure**

Replace the grouped calculations rendering (lines 241-259):
```typescript
{/* Grouped by property */}
{groupedByProperty.properties.map(({ property, calculations: calcs }) => (
  <React.Fragment key={property.id}>
    <ListSubheader sx={{ backgroundColor: 'background.paper' }}>
      {property.name || property.address?.street || `Property ${property.id}`}
    </ListSubheader>
    {calcs.map((calc) => (
      <CalculationListItem
        key={calc.id}
        calculation={calc}
        property={calc.property}
        isSelected={comparisonCalculations.some((c) => c.id === calc.id)}
        onClick={() => handleAddToComparison(calc)}
      />
    ))}
  </React.Fragment>
))}

{/* Unlinked calculations */}
{groupedByProperty.unlinked.length > 0 && (
  <>
    <ListSubheader sx={{ backgroundColor: 'background.paper' }}>
      {t('investment-calculator:unlinkedCalculations')}
    </ListSubheader>
    {groupedByProperty.unlinked.map((calc) => (
      <CalculationListItem
        key={calc.id}
        calculation={calc}
        isSelected={comparisonCalculations.some((c) => c.id === calc.id)}
        onClick={() => handleAddToComparison(calc)}
      />
    ))}
  </>
)}
```

**Step 3: Update empty state check**

Change the empty state condition (line 158):
```typescript
if (calculations.length === 0 && prospects.length === 0) {
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView" --testNamePattern="shows prospects without calculations"`
Expected: PASS

**Step 5: Run all tests**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView"`
Expected: Some tests may fail due to mock changes - fix them in next step

**Step 6: Fix any broken tests**

Update other tests to use `setupMocks` helper where needed.

**Step 7: Commit**

```bash
git add frontend/src/components/investment-calculator/ProspectCompareView.tsx frontend/src/components/investment-calculator/ProspectCompareView.test.tsx
git commit -m "$(cat <<'EOF'
feat: show all prospects in compare view grouped with calculations
EOF
)"
```

---

## Task 5: Add failing test for Add Calculation button

**Files:**
- Modify: `frontend/src/components/investment-calculator/ProspectCompareView.test.tsx`

**Step 1: Write the failing test**

Add a new describe block:
```typescript
describe('Add Calculation', () => {
  it('shows Add Calculation button for each prospect', async () => {
    const prospect = createMockProperty({ id: 1, name: 'Test Prospect' });
    setupMocks({ calculations: [], prospects: [prospect] });

    renderWithProviders(<ProspectCompareView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add calculation/i })).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView" --testNamePattern="shows Add Calculation button"`
Expected: FAIL - button not found

**Step 3: Commit failing test**

```bash
git add frontend/src/components/investment-calculator/ProspectCompareView.test.tsx
git commit -m "$(cat <<'EOF'
test: add failing test for Add Calculation button per prospect
EOF
)"
```

---

## Task 6: Implement Add Calculation button

**Files:**
- Modify: `frontend/src/components/investment-calculator/ProspectCompareView.tsx`

**Step 1: Add button to each property group**

Add import for Add icon:
```typescript
import AddIcon from '@mui/icons-material/Add';
import { ListItemButton, ListItemText, ListItemIcon } from '@mui/material';
```

Update the property group rendering to include Add button:
```typescript
{groupedByProperty.properties.map(({ property, calculations: calcs }) => (
  <React.Fragment key={property.id}>
    <ListSubheader sx={{ backgroundColor: 'background.paper' }}>
      {property.name || property.address?.street || `Property ${property.id}`}
    </ListSubheader>
    {calcs.map((calc) => (
      <CalculationListItem
        key={calc.id}
        calculation={calc}
        property={calc.property}
        isSelected={comparisonCalculations.some((c) => c.id === calc.id)}
        onClick={() => handleAddToComparison(calc)}
      />
    ))}
    <ListItemButton
      sx={{ pl: 4 }}
      onClick={() => handleOpenAddDialog(property)}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <AddIcon color="primary" fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={t('investment-calculator:addCalculation')}
        primaryTypographyProps={{ color: 'primary', variant: 'body2' }}
      />
    </ListItemButton>
  </React.Fragment>
))}
```

**Step 2: Add state and handler for dialog**

Add state after other states:
```typescript
const [addDialogProperty, setAddDialogProperty] = useState<Property | null>(null);
```

Add handler:
```typescript
const handleOpenAddDialog = useCallback((property: Property) => {
  setAddDialogProperty(property);
}, []);

const handleCloseAddDialog = useCallback(() => {
  setAddDialogProperty(null);
}, []);
```

**Step 3: Run test to verify it passes**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView" --testNamePattern="shows Add Calculation button"`
Expected: PASS

**Step 4: Commit**

```bash
git add frontend/src/components/investment-calculator/ProspectCompareView.tsx
git commit -m "$(cat <<'EOF'
feat: add Add Calculation button for each prospect
EOF
)"
```

---

## Task 7: Add failing test for opening dialog

**Files:**
- Modify: `frontend/src/components/investment-calculator/ProspectCompareView.test.tsx`

**Step 1: Write the failing test**

Add to "Add Calculation" describe block:
```typescript
it('opens InvestmentAddDialog when Add Calculation clicked', async () => {
  const user = userEvent.setup();
  const prospect = createMockProperty({ id: 1, name: 'Test Prospect' });
  setupMocks({ calculations: [], prospects: [prospect] });

  renderWithProviders(<ProspectCompareView />);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /add calculation/i })).toBeInTheDocument();
  });

  await user.click(screen.getByRole('button', { name: /add calculation/i }));

  // Dialog should open with the property name in title or form
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  expect(screen.getByText(/new calculation/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView" --testNamePattern="opens InvestmentAddDialog"`
Expected: FAIL - dialog not found

**Step 3: Commit failing test**

```bash
git add frontend/src/components/investment-calculator/ProspectCompareView.test.tsx
git commit -m "$(cat <<'EOF'
test: add failing test for opening InvestmentAddDialog
EOF
)"
```

---

## Task 8: Implement dialog integration

**Files:**
- Modify: `frontend/src/components/investment-calculator/ProspectCompareView.tsx`

**Step 1: Import InvestmentAddDialog**

Add import:
```typescript
import InvestmentAddDialog from '../property/sections/InvestmentAddDialog';
```

**Step 2: Add dialog at end of component JSX**

Before the closing `</Box>`:
```typescript
{/* Add Calculation Dialog */}
{addDialogProperty && (
  <InvestmentAddDialog
    open={!!addDialogProperty}
    property={addDialogProperty}
    onClose={handleCloseAddDialog}
    onSave={handleCalculationSaved}
  />
)}
```

**Step 3: Add save handler**

Add handler after other handlers:
```typescript
const handleCalculationSaved = useCallback((calculation: SavedInvestmentCalculation) => {
  // Refresh the list
  fetchCalculations();

  // Auto-add to comparison if under limit
  if (comparisonCalculations.length < MAX_CALCULATIONS) {
    setComparisonCalculations((prev) => [...prev, calculation]);
  }

  handleCloseAddDialog();
}, [fetchCalculations, comparisonCalculations.length, handleCloseAddDialog]);
```

Add import for SavedInvestmentCalculation if not already present.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView" --testNamePattern="opens InvestmentAddDialog"`
Expected: PASS

**Step 5: Run all tests**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView"`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add frontend/src/components/investment-calculator/ProspectCompareView.tsx
git commit -m "$(cat <<'EOF'
feat: integrate InvestmentAddDialog for adding calculations
EOF
)"
```

---

## Task 9: Add failing test for auto-adding to comparison

**Files:**
- Modify: `frontend/src/components/investment-calculator/ProspectCompareView.test.tsx`

**Step 1: Write the failing test**

Add to "Add Calculation" describe block:
```typescript
it('auto-adds new calculation to comparison after save', async () => {
  const user = userEvent.setup();
  const prospect = createMockProperty({ id: 1, name: 'Test Prospect' });
  setupMocks({ calculations: [], prospects: [prospect] });

  // Mock the post call for saving calculation
  const mockPost = jest.spyOn(ApiClient, 'post').mockResolvedValue({
    data: createMockCalculation({ id: 100, name: 'New Calc', propertyId: 1 }),
  });

  renderWithProviders(<ProspectCompareView />);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /add calculation/i })).toBeInTheDocument();
  });

  // Click add button
  await user.click(screen.getByRole('button', { name: /add calculation/i }));

  // Fill in the form
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  const nameInput = screen.getByLabelText(/calculation name/i);
  await user.type(nameInput, 'New Calc');

  // Submit the form
  await user.click(screen.getByRole('button', { name: /^save$/i }));

  // Verify API was called
  await waitFor(() => {
    expect(mockPost).toHaveBeenCalled();
  });

  // Verify calculation appears in comparison zone
  const comparisonZone = screen.getByTestId('comparison-drop-zone');
  await waitFor(() => {
    expect(within(comparisonZone).getByText('New Calc')).toBeInTheDocument();
  });

  mockPost.mockRestore();
});
```

**Step 2: Run test to verify current state**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView" --testNamePattern="auto-adds new calculation"`
Expected: May pass or fail depending on implementation state

**Step 3: Commit test**

```bash
git add frontend/src/components/investment-calculator/ProspectCompareView.test.tsx
git commit -m "$(cat <<'EOF'
test: add test for auto-adding calculation to comparison
EOF
)"
```

---

## Task 10: Run full test suite and fix issues

**Files:**
- Modify: `frontend/src/components/investment-calculator/ProspectCompareView.test.tsx` (if needed)
- Modify: `frontend/src/components/investment-calculator/ProspectCompareView.tsx` (if needed)

**Step 1: Run all component tests**

Run: `cd frontend && npm test -- --testPathPattern="ProspectCompareView"`
Expected: All tests PASS

**Step 2: Run full frontend test suite**

Run: `cd frontend && npm test`
Expected: All tests PASS

**Step 3: Fix any failing tests**

Address any test failures by checking:
- Mock setup is correct for all tests
- State updates are properly awaited
- Translation keys exist

**Step 4: Commit fixes**

```bash
git add frontend/
git commit -m "$(cat <<'EOF'
fix: address test failures in ProspectCompareView
EOF
)"
```

---

## Task 11: Manual verification

**Step 1: Start development server**

Run: `cd frontend && npm run dev`

**Step 2: Navigate to compare view**

Open: `http://localhost:8080/app/portfolio/prospects?view=compare`

**Step 3: Verify functionality**

Check:
- [ ] All prospect properties appear in left panel
- [ ] Each property has an "Add Calculation" button
- [ ] Properties without calculations are shown
- [ ] Properties with calculations show nested calculations
- [ ] Clicking "Add Calculation" opens dialog
- [ ] Dialog pre-fills with property data (price, rent, size)
- [ ] Saving calculation adds it to the list
- [ ] New calculation auto-appears in comparison area

**Step 4: Build check**

Run: `cd frontend && npm run build`
Expected: Build succeeds without errors

**Step 5: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: add calculation for apartments in prospects compare view

- Fetch all prospects alongside calculations
- Show all prospects grouped with their calculations
- Add "Add Calculation" button per prospect
- Reuse InvestmentAddDialog with property defaults
- Auto-add new calculations to comparison (max 5)
EOF
)"
```

---

## Summary

This plan implements the ability to create investment calculations for apartments directly from the prospects compare view using TDD:

1. **Tasks 1-2:** Fetch prospects alongside calculations
2. **Tasks 3-4:** Display all prospects grouped with calculations
3. **Tasks 5-6:** Add "Add Calculation" button per prospect
4. **Tasks 7-8:** Integrate InvestmentAddDialog
5. **Task 9:** Test auto-add to comparison
6. **Tasks 10-11:** Full test suite and manual verification
