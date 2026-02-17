# Property Cascade Delete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Change property deletion to cascade-delete all dependencies (transactions, expenses, incomes, statistics, depreciation assets) with a warning UI.

**Architecture:** Add `onDelete: 'CASCADE'` to TypeORM entity relations, modify the backend service to always allow deletion, and change the frontend dialog from blocking to warning+confirm.

**Tech Stack:** NestJS/TypeORM (backend), React/MUI (frontend), Jest (testing)

---

## Task 1: Add CASCADE to Transaction Entity

**Files:**
- Modify: `backend/src/accounting/transaction/entities/transaction.entity.ts:55-62`

**Step 1: Write the failing test**

Add to `backend/src/real-estate/property/property.service.spec.ts` in the `delete` describe block:

```typescript
it('deletes property with transactions via cascade', async () => {
  const property = createProperty({ id: 1 });
  mockRepository.findOneBy.mockResolvedValue(property);
  mockAuthService.hasOwnership.mockResolvedValue(true);
  mockRepository.delete.mockResolvedValue({ affected: 1 });
  // Even with transactions, deletion should proceed (cascade handles it)
  mockTransactionRepository.count.mockResolvedValue(5);

  await service.delete(testUser, 1);

  expect(mockRepository.delete).toHaveBeenCalledWith(1);
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --testPathPattern=property.service.spec.ts --testNamePattern="deletes property with transactions via cascade"`

Expected: FAIL (currently throws BadRequestException when dependencies exist)

**Step 3: Add CASCADE to Transaction entity**

Edit `backend/src/accounting/transaction/entities/transaction.entity.ts` lines 55-62:

```typescript
/*Property*/
@ManyToOne(() => Property, (property) => property.transactions, {
  eager: false,
  cascade: false,
  onDelete: 'CASCADE',
})
@JoinColumn({ name: 'propertyId' })
property: Property;
```

**Step 4: Commit entity change**

```bash
git add backend/src/accounting/transaction/entities/transaction.entity.ts
git commit -m "$(cat <<'EOF'
feat: add CASCADE delete to Transaction -> Property relation
EOF
)"
```

---

## Task 2: Add CASCADE to Expense Entity

**Files:**
- Modify: `backend/src/accounting/expense/entities/expense.entity.ts:45-53`

**Step 1: Add CASCADE to Expense entity**

Edit `backend/src/accounting/expense/entities/expense.entity.ts` lines 45-53:

```typescript
/*Property*/
@ManyToOne(() => Property, (property) => property.expenses, {
  eager: false,
  cascade: ['insert', 'update'],
  onDelete: 'CASCADE',
})
@JoinColumn({ name: 'propertyId' })
property: Property;
```

**Step 2: Commit entity change**

```bash
git add backend/src/accounting/expense/entities/expense.entity.ts
git commit -m "$(cat <<'EOF'
feat: add CASCADE delete to Expense -> Property relation
EOF
)"
```

---

## Task 3: Add CASCADE to Income Entity

**Files:**
- Modify: `backend/src/accounting/income/entities/income.entity.ts:45-53`

**Step 1: Add CASCADE to Income entity**

Edit `backend/src/accounting/income/entities/income.entity.ts` lines 45-53:

```typescript
/*Property*/
@ManyToOne(() => Property, (property) => property.incomes, {
  eager: false,
  cascade: ['insert', 'update'],
  onDelete: 'CASCADE',
})
@JoinColumn({ name: 'propertyId' })
property: Property;
```

**Step 2: Commit entity change**

```bash
git add backend/src/accounting/income/entities/income.entity.ts
git commit -m "$(cat <<'EOF'
feat: add CASCADE delete to Income -> Property relation
EOF
)"
```

---

## Task 4: Add CASCADE to PropertyStatistics Entity

**Files:**
- Modify: `backend/src/real-estate/property/entities/property-statistics.entity.ts:23-27`

**Step 1: Add CASCADE to PropertyStatistics entity**

Edit `backend/src/real-estate/property/entities/property-statistics.entity.ts` lines 23-27:

```typescript
@ManyToOne(() => Property, (property) => property.statistics, {
  onDelete: 'CASCADE',
})
@JoinColumn({ name: 'propertyId' })
property: Property;
```

**Step 2: Commit entity change**

```bash
git add backend/src/real-estate/property/entities/property-statistics.entity.ts
git commit -m "$(cat <<'EOF'
feat: add CASCADE delete to PropertyStatistics -> Property relation
EOF
)"
```

---

## Task 5: Add CASCADE to DepreciationAsset Entity

**Files:**
- Modify: `backend/src/accounting/depreciation/entities/depreciation-asset.entity.ts:28-34`

**Step 1: Add CASCADE to DepreciationAsset entity**

Edit `backend/src/accounting/depreciation/entities/depreciation-asset.entity.ts` lines 28-34:

```typescript
// Property
@ManyToOne(() => Property, {
  eager: false,
  onDelete: 'CASCADE',
})
@JoinColumn({ name: 'propertyId' })
property: Property;
```

**Step 2: Commit entity change**

```bash
git add backend/src/accounting/depreciation/entities/depreciation-asset.entity.ts
git commit -m "$(cat <<'EOF'
feat: add CASCADE delete to DepreciationAsset -> Property relation
EOF
)"
```

---

## Task 6: Update PropertyService Delete Method

**Files:**
- Modify: `backend/src/real-estate/property/property.service.ts:167-177`
- Test: `backend/src/real-estate/property/property.service.spec.ts`

**Step 1: Update unit tests for new delete behavior**

In `backend/src/real-estate/property/property.service.spec.ts`, update the `delete` describe block:

Remove or modify these tests that expect blocking:
- `throws BadRequestException when dependencies exist`
- `does not call repository.delete when dependencies exist`

Add new tests:

```typescript
it('deletes property even when dependencies exist (cascade handles them)', async () => {
  const property = createProperty({ id: 1 });
  mockRepository.findOneBy.mockResolvedValue(property);
  mockAuthService.hasOwnership.mockResolvedValue(true);
  mockRepository.delete.mockResolvedValue({ affected: 1 });
  // Set up dependencies - should NOT block deletion anymore
  mockTransactionRepository.count.mockResolvedValue(5);
  mockExpenseRepository.count.mockResolvedValue(3);
  mockIncomeRepository.count.mockResolvedValue(2);
  mockStatisticsRepository.count.mockResolvedValue(10);
  mockDepreciationAssetRepository.count.mockResolvedValue(1);

  await service.delete(testUser, 1);

  expect(mockRepository.delete).toHaveBeenCalledWith(1);
});
```

**Step 2: Run tests to verify they fail**

Run: `cd backend && npm test -- --testPathPattern=property.service.spec.ts --testNamePattern="delete"`

Expected: Tests fail because service still blocks deletion

**Step 3: Update delete method to not block**

Edit `backend/src/real-estate/property/property.service.ts` lines 167-177:

```typescript
async delete(user: JWTUser, id: number): Promise<void> {
  const property = await this.getEntityOrThrow(user, id);

  if (property.photo) {
    await this.deletePhotoFile(property.photo);
  }
  await this.repository.delete(id);
}
```

**Step 4: Run tests to verify they pass**

Run: `cd backend && npm test -- --testPathPattern=property.service.spec.ts --testNamePattern="delete"`

Expected: All tests pass

**Step 5: Commit service changes**

```bash
git add backend/src/real-estate/property/property.service.ts backend/src/real-estate/property/property.service.spec.ts
git commit -m "$(cat <<'EOF'
feat: remove delete blocking in PropertyService

Cascade delete handles dependencies at database level.
EOF
)"
```

---

## Task 7: Update validateDelete to Return Warning Info

**Files:**
- Modify: `backend/src/real-estate/property/property.service.ts:179-281`
- Modify: `backend/src/real-estate/property/dtos/property-delete-validation.dto.ts`

**Step 1: Update unit tests for validateDelete**

In `backend/src/real-estate/property/property.service.spec.ts`, update the `validateDelete` describe block:

Change the test `returns canDelete: false with transaction dependency` to expect `canDelete: true`:

```typescript
it('returns canDelete: true even with dependencies (warning only)', async () => {
  const property = createProperty({ id: 1 });
  const transactions = [
    createTransaction({ id: 1, propertyId: 1, description: 'Trans 1' }),
    createTransaction({ id: 2, propertyId: 1, description: 'Trans 2' }),
  ];
  mockRepository.findOneBy.mockResolvedValue(property);
  mockAuthService.hasOwnership.mockResolvedValue(true);
  mockTransactionRepository.count.mockResolvedValue(2);
  mockTransactionRepository.find.mockResolvedValue(transactions);

  const { validation } = await service.validateDelete(testUser, 1);

  expect(validation.canDelete).toBe(true);
  expect(validation.dependencies).toHaveLength(1);
  expect(validation.dependencies[0].type).toBe('transaction');
  expect(validation.dependencies[0].count).toBe(2);
  // Message should be warning, not blocking
  expect(validation.message).toContain('will be deleted');
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --testPathPattern=property.service.spec.ts --testNamePattern="returns canDelete: true even with dependencies"`

Expected: FAIL (canDelete is currently false)

**Step 3: Update validateDelete method**

Edit `backend/src/real-estate/property/property.service.ts` lines 268-280:

```typescript
const dependencies = await Promise.all(samplePromises);
const hasDependencies = dependencies.length > 0;

return {
  validation: {
    canDelete: true, // Always allow - cascade handles deletion
    dependencies,
    message: hasDependencies
      ? 'The following related data will be deleted with the property'
      : undefined,
  },
  property,
};
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --testPathPattern=property.service.spec.ts --testNamePattern="validateDelete"`

Expected: All tests pass

**Step 5: Commit changes**

```bash
git add backend/src/real-estate/property/property.service.ts backend/src/real-estate/property/property.service.spec.ts
git commit -m "$(cat <<'EOF'
feat: change validateDelete to return warning instead of blocking

canDelete is now always true since cascade handles deletion.
Message explains what will be deleted.
EOF
)"
```

---

## Task 8: Update Frontend AlisaDependencyDialog

**Files:**
- Modify: `frontend/src/components/alisa/dialog/AlisaDependencyDialog.tsx`
- Modify: `frontend/src/translations/en.ts`
- Modify: `frontend/src/translations/fi.ts`
- Modify: `frontend/src/translations/sv.ts`

**Step 1: Add new translation keys**

Edit `frontend/src/translations/en.ts` dependencies section (around line 99):

```typescript
dependencies: {
  cannotDelete: "This item cannot be deleted because it has related data.",
  cannotDeleteTitle: "Cannot Delete",
  deleteWarningTitle: "Confirm Delete",
  deleteWarning: "The following related data will also be deleted:",
  deleteConfirm: "Delete All",
  transactions: "Transactions",
  expenses: "Expenses",
  incomes: "Incomes",
  statistics: "Statistics",
  depreciationAssets: "Depreciation Assets",
  andMore: "...and {{count}} more",
},
```

Edit `frontend/src/translations/fi.ts` dependencies section:

```typescript
dependencies: {
  cannotDelete: "Tätä ei voi poistaa, koska sillä on liittyviä tietoja.",
  cannotDeleteTitle: "Ei voi poistaa",
  deleteWarningTitle: "Vahvista poisto",
  deleteWarning: "Seuraavat liittyvät tiedot poistetaan myös:",
  deleteConfirm: "Poista kaikki",
  transactions: "Tapahtumat",
  expenses: "Kulut",
  incomes: "Tulot",
  statistics: "Tilastot",
  depreciationAssets: "Poistot",
  andMore: "...ja {{count}} muuta",
},
```

Edit `frontend/src/translations/sv.ts` dependencies section:

```typescript
dependencies: {
  cannotDelete: "Detta kan inte raderas eftersom det har relaterade data.",
  cannotDeleteTitle: "Kan inte radera",
  deleteWarningTitle: "Bekräfta radering",
  deleteWarning: "Följande relaterade data kommer också att raderas:",
  deleteConfirm: "Radera allt",
  transactions: "Transaktioner",
  expenses: "Utgifter",
  incomes: "Inkomster",
  statistics: "Statistik",
  depreciationAssets: "Avskrivningstillgångar",
  andMore: "...och {{count}} fler",
},
```

**Step 2: Update AlisaDependencyDialog component**

Edit `frontend/src/components/alisa/dialog/AlisaDependencyDialog.tsx`:

```typescript
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useTranslation } from "react-i18next";
import { DeleteValidationResult, DependencyType } from "@alisa-types";

interface AlisaDependencyDialogProps {
  open: boolean;
  validationResult: DeleteValidationResult | null;
  onClose: () => void;
  onConfirmDelete?: () => void;
}

function AlisaDependencyDialog({
  open,
  validationResult,
  onClose,
  onConfirmDelete,
}: AlisaDependencyDialogProps) {
  const { t } = useTranslation();

  const getDependencyLabel = (type: DependencyType): string => {
    const labels: Record<DependencyType, string> = {
      transaction: t("common:dependencies.transactions"),
      expense: t("common:dependencies.expenses"),
      income: t("common:dependencies.incomes"),
      statistics: t("common:dependencies.statistics"),
      depreciationAsset: t("common:dependencies.depreciationAssets"),
    };
    return labels[type];
  };

  if (!validationResult) {
    return null;
  }

  const handleConfirmDelete = () => {
    onClose();
    onConfirmDelete?.();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningAmberIcon color="warning" />
        {t("common:dependencies.deleteWarningTitle")}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t("common:dependencies.deleteWarning")}
        </Typography>
        {validationResult.dependencies.map((group) => (
          <Accordion key={group.type} defaultExpanded={false}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${group.type}-content`}
              id={`${group.type}-header`}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: "100%",
                }}
              >
                <Typography>{getDependencyLabel(group.type)}</Typography>
                <Chip
                  label={group.count}
                  size="small"
                  color="warning"
                  data-testid={`${group.type}-count`}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense disablePadding>
                {group.samples.map((item) => (
                  <ListItem key={item.id} disableGutters>
                    <ListItemText
                      primary={item.description}
                      secondary={`ID: ${item.id}`}
                    />
                  </ListItem>
                ))}
                {group.count > group.samples.length && (
                  <ListItem disableGutters>
                    <ListItemText
                      primary={t("common:dependencies.andMore", {
                        count: group.count - group.samples.length,
                      })}
                      primaryTypographyProps={{
                        fontStyle: "italic",
                        color: "text.secondary",
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          {t("common:cancel")}
        </Button>
        <Button
          onClick={handleConfirmDelete}
          variant="contained"
          color="error"
        >
          {t("common:dependencies.deleteConfirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AlisaDependencyDialog;
```

**Step 3: Commit frontend changes**

```bash
git add frontend/src/components/alisa/dialog/AlisaDependencyDialog.tsx frontend/src/translations/en.ts frontend/src/translations/fi.ts frontend/src/translations/sv.ts
git commit -m "$(cat <<'EOF'
feat: change dependency dialog to warning with confirm button

Dialog now shows warning icon and has "Delete All" button.
EOF
)"
```

---

## Task 9: Update AlisaCardList to Handle Confirmation

**Files:**
- Modify: `frontend/src/components/alisa/AlisaCardList.tsx`

**Step 1: Update AlisaCardList delete flow**

Edit `frontend/src/components/alisa/AlisaCardList.tsx`:

Update the state and handlers:

```typescript
const [pendingDeleteId, setPendingDeleteId] = React.useState<number>(0);

const handleDelete = async () => {
  try {
    await ApiClient.delete(alisaContext.apiPath, idToDelete);
    setIdDeleted(idToDelete);
    handleClose();
    showToast({ message: t("toast.deleteSuccess"), severity: "success" });
  } catch (error) {
    handleClose();
    if (error instanceof AxiosError && error.response?.status === 400) {
      const responseData = error.response.data;
      if (responseData?.dependencies) {
        setValidationResult(responseData as DeleteValidationResult);
        setPendingDeleteId(idToDelete);
        setDependencyDialogOpen(true);
        return;
      }
    }
    showToast({ message: t("toast.deleteError"), severity: "error" });
  }
};

const handleConfirmDeleteWithDependencies = async () => {
  // Since backend now allows deletion with cascade, just retry the delete
  try {
    await ApiClient.delete(alisaContext.apiPath, pendingDeleteId);
    setIdDeleted(pendingDeleteId);
    setPendingDeleteId(0);
    showToast({ message: t("toast.deleteSuccess"), severity: "success" });
  } catch (error) {
    showToast({ message: t("toast.deleteError"), severity: "error" });
  }
};

const handleDependencyDialogClose = () => {
  setDependencyDialogOpen(false);
  setValidationResult(null);
  setPendingDeleteId(0);
};
```

Update the dialog component:

```tsx
<AlisaDependencyDialog
  open={dependencyDialogOpen}
  validationResult={validationResult}
  onClose={handleDependencyDialogClose}
  onConfirmDelete={handleConfirmDeleteWithDependencies}
/>
```

**Step 2: Commit changes**

```bash
git add frontend/src/components/alisa/AlisaCardList.tsx
git commit -m "$(cat <<'EOF'
feat: update AlisaCardList to handle cascade delete confirmation
EOF
)"
```

---

## Task 10: Update Frontend to Pre-fetch Dependencies

**Files:**
- Modify: `frontend/src/components/alisa/AlisaCardList.tsx`

**Step 1: Pre-fetch dependencies before showing confirm dialog**

Update the delete click handler to first check dependencies:

```typescript
const handleClickOpen = async (apartmentId: number) => {
  setIdToDelete(apartmentId);

  // Pre-fetch dependencies to show in confirmation
  try {
    const validation = await ApiClient.get<DeleteValidationResult>(
      `${alisaContext.apiPath}/${apartmentId}/can-delete`
    );

    if (validation.dependencies && validation.dependencies.length > 0) {
      setValidationResult(validation);
      setPendingDeleteId(apartmentId);
      setDependencyDialogOpen(true);
    } else {
      // No dependencies, show simple confirm
      setOpen(true);
    }
  } catch (error) {
    // Fallback to simple confirm if check fails
    setOpen(true);
  }
};
```

**Step 2: Update handleConfirmDeleteWithDependencies**

```typescript
const handleConfirmDeleteWithDependencies = async () => {
  try {
    await ApiClient.delete(alisaContext.apiPath, pendingDeleteId);
    setIdDeleted(pendingDeleteId);
    setPendingDeleteId(0);
    setValidationResult(null);
    setDependencyDialogOpen(false);
    showToast({ message: t("toast.deleteSuccess"), severity: "success" });
  } catch (error) {
    showToast({ message: t("toast.deleteError"), severity: "error" });
  }
};
```

**Step 3: Commit changes**

```bash
git add frontend/src/components/alisa/AlisaCardList.tsx
git commit -m "$(cat <<'EOF'
feat: pre-fetch dependencies before delete confirmation

Shows dependency warning dialog if related data exists,
otherwise shows simple confirmation dialog.
EOF
)"
```

---

## Task 11: Write E2E Test for Cascade Delete

**Files:**
- Modify: `backend/test/property.controller.e2e-spec.ts`

**Step 1: Add E2E test for cascade deletion**

Add to `backend/test/property.controller.e2e-spec.ts` in the `DELETE /real-estate/property/:id` describe block:

```typescript
it('cascade deletes all dependencies when property is deleted', async () => {
  const user = testUsers.user1WithProperties;
  const token = await getUserAccessToken2(authService, user.jwtUser);

  // Create a property
  const propertyInput = {
    name: 'Property with All Dependencies',
    size: 50,
    ownerships: [{ share: 100 }],
  };

  const createResponse = await request(server)
    .post('/real-estate/property')
    .set('Authorization', getBearerToken(token))
    .send(propertyInput)
    .expect(201);

  const propertyId = createResponse.body.id;

  // Add a transaction (which creates statistics automatically)
  await transactionService.add(user.jwtUser, {
    propertyId,
    status: TransactionStatus.ACCEPTED,
    type: TransactionType.INCOME,
    sender: 'Test Sender',
    receiver: 'Test Receiver',
    description: 'Cascade Test Transaction',
    transactionDate: new Date('2023-05-15'),
    accountingDate: new Date('2023-05-15'),
    amount: 500,
  });
  await eventTracker.waitForPending();

  // Verify dependencies exist
  const transactionsBefore = await dataSource.query(
    'SELECT COUNT(*) FROM transaction WHERE "propertyId" = $1',
    [propertyId]
  );
  expect(parseInt(transactionsBefore[0].count)).toBeGreaterThan(0);

  const statisticsBefore = await dataSource.query(
    'SELECT COUNT(*) FROM property_statistics WHERE "propertyId" = $1',
    [propertyId]
  );
  expect(parseInt(statisticsBefore[0].count)).toBeGreaterThan(0);

  // Delete the property - should succeed now
  await request(server)
    .delete(`/real-estate/property/${propertyId}`)
    .set('Authorization', getBearerToken(token))
    .expect(200);

  // Verify property is deleted
  await request(server)
    .get(`/real-estate/property/${propertyId}`)
    .set('Authorization', getBearerToken(token))
    .expect(404);

  // Verify all dependencies are deleted
  const transactionsAfter = await dataSource.query(
    'SELECT COUNT(*) FROM transaction WHERE "propertyId" = $1',
    [propertyId]
  );
  expect(parseInt(transactionsAfter[0].count)).toBe(0);

  const expensesAfter = await dataSource.query(
    'SELECT COUNT(*) FROM expense WHERE "propertyId" = $1',
    [propertyId]
  );
  expect(parseInt(expensesAfter[0].count)).toBe(0);

  const incomesAfter = await dataSource.query(
    'SELECT COUNT(*) FROM income WHERE "propertyId" = $1',
    [propertyId]
  );
  expect(parseInt(incomesAfter[0].count)).toBe(0);

  const statisticsAfter = await dataSource.query(
    'SELECT COUNT(*) FROM property_statistics WHERE "propertyId" = $1',
    [propertyId]
  );
  expect(parseInt(statisticsAfter[0].count)).toBe(0);
});
```

**Step 2: Run E2E test**

Run: `cd backend && npm run test:e2e -- --testPathPattern=property.controller.e2e-spec.ts --testNamePattern="cascade deletes"`

Expected: Test passes

**Step 3: Update the existing blocking test**

Find and update the test `returns 400 with dependency details when property has transactions` to verify the new behavior (now returns 200 and deletes everything):

```typescript
it('successfully deletes property with transactions via cascade', async () => {
  const user = testUsers.user1WithProperties;
  const token = await getUserAccessToken2(authService, user.jwtUser);

  // Create a property
  const propertyInput = {
    name: 'Property with Transactions',
    size: 40,
    ownerships: [{ share: 100 }],
  };

  const createResponse = await request(server)
    .post('/real-estate/property')
    .set('Authorization', getBearerToken(token))
    .send(propertyInput)
    .expect(201);

  const propertyId = createResponse.body.id;

  // Add a transaction to the property
  await transactionService.add(user.jwtUser, {
    propertyId,
    status: TransactionStatus.ACCEPTED,
    type: TransactionType.INCOME,
    sender: 'Test Sender',
    receiver: 'Test Receiver',
    description: 'Test Transaction',
    transactionDate: new Date('2023-01-15'),
    accountingDate: new Date('2023-01-15'),
    amount: 100,
  });
  await eventTracker.waitForPending();

  // Delete should now succeed (cascade handles dependencies)
  await request(server)
    .delete(`/real-estate/property/${propertyId}`)
    .set('Authorization', getBearerToken(token))
    .expect(200);

  // Verify property is gone
  await request(server)
    .get(`/real-estate/property/${propertyId}`)
    .set('Authorization', getBearerToken(token))
    .expect(404);
});
```

**Step 4: Run all E2E tests**

Run: `cd backend && npm run test:e2e -- --testPathPattern=property.controller.e2e-spec.ts`

Expected: All tests pass

**Step 5: Commit E2E tests**

```bash
git add backend/test/property.controller.e2e-spec.ts
git commit -m "$(cat <<'EOF'
test: update e2e tests for cascade delete behavior

Verifies that deleting a property also deletes all related
transactions, expenses, incomes, and statistics.
EOF
)"
```

---

## Task 12: Run Full Test Suite and Final Commit

**Step 1: Run backend tests**

Run: `cd backend && npm test`

Expected: All tests pass

**Step 2: Run backend E2E tests**

Run: `cd backend && npm run test:e2e`

Expected: All tests pass

**Step 3: Run frontend tests**

Run: `cd frontend && npm test`

Expected: All tests pass

**Step 4: Final commit with summary**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: implement cascade delete for properties

When a property is deleted, all related data is automatically
deleted by the database:
- Transactions
- Expenses
- Incomes
- PropertyStatistics
- DepreciationAssets

The UI now shows a warning dialog listing what will be deleted,
with a "Delete All" confirmation button.

Closes: property-cascade-delete
EOF
)"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add CASCADE to Transaction | `transaction.entity.ts` |
| 2 | Add CASCADE to Expense | `expense.entity.ts` |
| 3 | Add CASCADE to Income | `income.entity.ts` |
| 4 | Add CASCADE to PropertyStatistics | `property-statistics.entity.ts` |
| 5 | Add CASCADE to DepreciationAsset | `depreciation-asset.entity.ts` |
| 6 | Update PropertyService delete | `property.service.ts`, `property.service.spec.ts` |
| 7 | Update validateDelete | `property.service.ts` |
| 8 | Update AlisaDependencyDialog | `AlisaDependencyDialog.tsx`, translations |
| 9 | Update AlisaCardList | `AlisaCardList.tsx` |
| 10 | Pre-fetch dependencies | `AlisaCardList.tsx` |
| 11 | E2E tests | `property.controller.e2e-spec.ts` |
| 12 | Final verification | All |
