# Property Cascade Delete Design

**Date:** 2025-02-17
**Status:** Approved

## Summary

Change property deletion from "block if dependencies exist" to "cascade delete all dependencies" with a warning UI that shows what will be deleted before confirmation.

## Current State

- Property deletion is **blocked** if any of these dependencies exist:
  - Transactions
  - Expenses
  - Incomes
  - PropertyStatistics
  - DepreciationAssets
- Ownership and Address already cascade-delete correctly
- UI shows `AlisaDependencyDialog` when deletion fails (400 error)

## Target State

- Property deletion **succeeds** and automatically deletes all dependencies
- Database-level `CASCADE` handles deletions atomically
- UI shows dependencies as a **warning** with "Delete All" confirmation button
- Tests verify all dependencies are actually deleted

## Architecture

```
DELETE /api/real-estate/property/:id
    │
    ├─→ Database: DELETE property WHERE id = :id
    │       │
    │       └─→ CASCADE triggers automatically delete:
    │               - All transactions with propertyId = :id
    │               - All expenses with propertyId = :id
    │               - All incomes with propertyId = :id
    │               - All statistics with propertyId = :id
    │               - All depreciation assets with propertyId = :id
    │
    └─→ Response: 200 OK
```

## Changes Required

### 1. Backend - Entity Relations

Add `onDelete: 'CASCADE'` to ManyToOne relations in:

| Entity | File | Change |
|--------|------|--------|
| Transaction | `accounting/transaction/entities/transaction.entity.ts` | Add `onDelete: 'CASCADE'` to property relation |
| Expense | `accounting/expense/entities/expense.entity.ts` | Add `onDelete: 'CASCADE'` to property relation |
| Income | `accounting/income/entities/income.entity.ts` | Add `onDelete: 'CASCADE'` to property relation |
| PropertyStatistics | `real-estate/property/entities/property-statistics.entity.ts` | Add `onDelete: 'CASCADE'` to property relation |
| DepreciationAsset | `accounting/depreciation/entities/depreciation-asset.entity.ts` | Add `onDelete: 'CASCADE'` to property relation |

### 2. Backend - PropertyService

- Remove `canDelete` blocking check from `delete()` method
- Keep `validateDelete()` for warning UI (returns dependency counts/samples)
- Change `canDelete` field to always return `true` (or remove it)

### 3. Frontend - AlisaDependencyDialog

- Change from "blocking" dialog to "warning + confirm" dialog
- Add "Delete All" button that proceeds with deletion
- Keep existing dependency display (accordion with counts and samples)

### 4. Tests

Create comprehensive tests proving cascade deletion works:

**Backend Unit Tests:**
- Delete property with transactions → transactions deleted
- Delete property with expenses → expenses deleted
- Delete property with incomes → incomes deleted
- Delete property with statistics → statistics deleted
- Delete property with depreciation assets → assets deleted
- Delete property with multiple dependency types → all deleted

**Backend E2E Tests:**
- Full HTTP flow: create property + dependencies → delete property → verify all gone

## Trade-offs

| Aspect | Chosen: Database CASCADE | Alternative: Application-level |
|--------|--------------------------|-------------------------------|
| Atomicity | Single transaction | Multiple queries |
| Performance | Fast | Slower |
| Reversibility | Permanent | Could add soft-delete |
| Complexity | Simple | More code to maintain |

## Out of Scope

- Soft-delete functionality
- Undo/recovery of deleted data
- Audit logging of cascade deletions
