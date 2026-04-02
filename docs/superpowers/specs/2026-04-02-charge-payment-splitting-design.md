# Charge Payment Splitting Design

**Date:** 2026-04-02
**Status:** Approved

## Overview

Split property charge payment transactions (yhtiövastike) into individual expense rows per charge type (maintenance, financial, water, other). Follows the same pattern as the existing loan payment splitting feature.

## Trigger Mechanisms

1. **Manual** — user clicks "Split to charges" on a single transaction or selects multiple and uses bulk action
2. **Allocation rule** — when a rule's `expenseTypeId` matches the `housing-charge` expense type, auto-split is triggered (same as `loan-payment` triggers loan splitting)

Both mechanisms are needed in the **transaction import view** and **pending transactions view**.

## Backend

### New Method: `TransactionService.splitChargePayment(user, transactionId)`

1. Load transaction, verify ownership
2. Verify transaction type is EXPENSE
3. Query `PropertyChargeService.getChargesForDate(propertyId, transactionDate)` for charges active on the transaction date
4. If no active charges → throw `BadRequestException`
5. If `Math.abs(transaction.amount)` !== sum of active charges → throw `BadRequestException` with mismatch details
6. For each active charge, create an Expense:
   - Look up expense type by key using `chargeTypeToExpenseTypeKey` mapping
   - `amount` = charge amount
   - `description` = expense type name
   - `accountingDate` = transaction date
   - `transactionId` = transaction ID
   - `propertyId` = transaction's property ID
7. Save all expenses

### New Method: `TransactionService.splitChargePaymentBulk(user, { ids })`

Loop through transaction IDs, call `splitChargePayment` for each. Skip failures, return results summary.

### New Method: `PropertyChargeService.getChargesForDate(propertyId, date)`

Returns charges active on a specific date:
```sql
WHERE propertyId = :propertyId
  AND (startDate IS NULL OR startDate <= :date)
  AND (endDate IS NULL OR endDate >= :date)
```

### Charge Type to Expense Type Mapping

| ChargeType enum | Expense type key |
|-----------------|-----------------|
| MAINTENANCE_FEE (1) | `maintenance-charge` |
| FINANCIAL_CHARGE (2) | `financial-charge` |
| WATER_PREPAYMENT (3) | `water` |
| OTHER_CHARGE_BASED (4) | `other-charge-based` |

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/accounting/transaction/:id/split-charge-payment` | Split single transaction |
| POST | `/api/accounting/transaction/split-charge-payment` | Bulk split |

### DTOs

- `SplitChargePaymentBulkInputDto` — `{ ids: number[] }`
- Single split needs no input DTO — charge types are determined automatically from property charges active on the transaction date

### Allocation Rule Integration

In `AllocationRuleService.allocateTransactions`:

1. Look up `housing-charge` expense type alongside existing loan payment lookups
2. When matching rule's `expenseTypeId` === `housing-charge` type ID → call `splitChargePayment`
3. Report as `action: 'charge_split'` on success
4. Report as `reason: 'charge_split_failed'` on failure

## Frontend

### Manual Trigger

Show "Split to charges" button in both **import view** and **pending transactions view** when:
- Transaction is type EXPENSE
- Transaction belongs to a property with active charges

### Bulk Action

In transaction list selection mode, show "Split to charges" bulk action. Calls bulk endpoint.

## Validation Rules

- Transaction must be type EXPENSE
- Transaction must belong to a property
- Property must have active charges on the transaction date
- `Math.abs(transaction.amount)` must equal the sum of active charge amounts

## Testing

### Backend Unit Tests (`transaction.service.spec.ts`)
- Success: creates correct expense rows with correct amounts and types
- Not found: transaction doesn't exist → 404
- Unauthorized: wrong user → 403
- No active charges on date → 400
- Amount mismatch → 400
- Bulk: success, partial failures, skips

### Backend Unit Tests (`allocation-rule.service.spec.ts`)
- Housing charge rule triggers charge split
- Charge split failure → transaction skipped

### Backend E2E Tests
- Single and bulk split endpoints with authentication
- Allocation rule auto-split for housing charges

### Frontend Tests
- Split button renders in import and pending views
- Bulk action calls correct API endpoint
- Error states displayed correctly