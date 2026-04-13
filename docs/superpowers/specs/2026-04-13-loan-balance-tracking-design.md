# Loan Balance Tracking Feature

## Overview

Add loan balance tracking to Asset, showing how property loans are paid down over time. Display the loan payoff curve in advanced reports and as a dashboard widget.

## Requirements

1. Track remaining loan balance per property over time
2. Store loan balance snapshots in `property_statistics`
3. Calculate balance: `purchaseLoan - SUM(LOAN_PRINCIPAL expenses)`
4. Show loan balance curve in property advanced reports
5. Show loan balance widget on dashboard

## Data Model

### StatisticKey Addition

Add to `backend/src/common/types.ts`:
```typescript
LOAN_BALANCE = 'loan_balance',
```

Add to `frontend/src/types/common.ts`:
```typescript
LOAN_BALANCE = 'loan_balance',
```

### PropertyStatistics Records

No schema changes needed. New records use existing structure:

| Field | Value |
|-------|-------|
| key | `'loan_balance'` |
| year | Year bucket (null for all-time) |
| month | Month bucket (null for yearly/all-time) |
| value | Remaining balance as string (e.g., "95000.00") |

### Data Source

- **Original loan:** `property.purchaseLoan` field (already exists)
- **Principal payments:** Expenses with `expense_type.key = 'loan-principal'`
- **Date filter:** Only payments with `accountingDate >= property.purchaseDate`

## Recalculation Logic

### In `PropertyStatisticsService.recalculate()`

1. Query properties with loans:
   ```sql
   SELECT id, "purchaseLoan", "purchaseDate" 
   FROM property 
   WHERE "purchaseLoan" IS NOT NULL
   ```

2. For each property, get LOAN_PRINCIPAL expenses:
   - Join expense with expense_type where `key = 'loan-principal'`
   - Filter: `accountingDate >= purchaseDate`
   - Group by year/month, order chronologically

3. Calculate running balance:
   - Start with `purchaseLoan`
   - For each month: `balance = previous_balance - SUM(payments)`
   - Store monthly snapshots

4. All-time record: Store current remaining balance

### Incremental Updates

Listen to existing expense events in PropertyStatisticsService:
- `Events.Expense.StandaloneCreated`
- `Events.Expense.StandaloneUpdated`
- `Events.Expense.StandaloneDeleted`

When the expense has `expenseType.key === 'loan-principal'`:
- Call `recalculateLoanBalance(propertyId)` to rebuild that property's loan_balance statistics
- Full recalculation is simpler than cascading updates; loan payments are infrequent

### Edge Cases

| Case | Handling |
|------|----------|
| No `purchaseLoan` set | Skip property entirely |
| No LOAN_PRINCIPAL expenses | Store `purchaseLoan` as balance |
| Payments before `purchaseDate` | Ignore (chronologically invalid) |

## Advanced Report Chart

### New Component

`frontend/src/components/property/report/LoanBalanceChart.tsx`

### Behavior

- Line chart showing remaining balance over time (downward slope)
- X-axis: months (e.g., "Jan 2024", "Feb 2024")
- Y-axis: balance in euros
- Tooltip shows exact balance on hover
- Chip showing current remaining balance (like existing charts)

### Integration

- Add to `PropertyReportCharts.tsx`
- Only render if property has `purchaseLoan` set
- Show "No loan data" message if no loan configured

### Visual Style

- Follow existing recharts patterns
- Line color: theme warning or secondary (distinguish from income/expense)
- First data point: original loan amount
- Responsive container

## Dashboard Widget

### New Component

`frontend/src/components/dashboard/widgets/LoanBalanceChart.tsx`

### Behavior

- Follows existing widget pattern
- Respects property selector (all or specific property)
- Aggregates total balance when multiple properties selected
- Line chart of balance trend

### Data Fetching

Create new `useLoanBalanceData` hook in `frontend/src/components/dashboard/widgets/hooks/`:
- Fetch `loan_balance` statistics via `/api/real-estate/property/statistics/search` with `{ key: 'loan_balance', includeMonthly: true }`
- Fetch properties to get `purchaseLoan` totals for the "original loan" display
- Follow same pattern as `useStatisticsData` hook

### Widget Registry

Add to `widget-registry.ts`:
```typescript
{
  id: "loanBalance",
  component: LoanBalanceChart,
  translationKey: "loanBalance",
  defaultSize: "1/2",
  height: 300,
}
```

### Display

- Title with chip showing current remaining balance
- Line chart showing balance trend
- "No loan data" message if no properties have loans

## Translations

### Property namespace (`frontend/src/translations/property/`)

| Key | EN | FI | SV |
|-----|----|----|-----|
| `report.loanBalance` | Loan Balance | Lainasaldo | Lånesaldo |
| `report.originalLoan` | Original Loan | Alkuperäinen laina | Ursprungligt lån |
| `report.remainingBalance` | Remaining | Jäljellä | Kvar |
| `report.noLoanData` | No loan data | Ei lainatietoja | Inga låneuppgifter |

### Dashboard namespace (`frontend/src/translations/dashboard/`)

| Key | EN | FI | SV |
|-----|----|----|-----|
| `loanBalance` | Loan Balance | Lainasaldo | Lånesaldo |
| `noLoanData` | No loan data | Ei lainatietoja | Inga låneuppgifter |

## Testing

### Backend Unit Tests

- `property-statistics.service.spec.ts`: Test loan balance recalculation
  - Property with loan and payments
  - Property without loan (skipped)
  - Payments before purchaseDate (ignored)
  - Running balance calculation accuracy

### Backend E2E Tests

- Test loan balance statistics endpoint returns correct data
- Test recalculation includes loan balance

### Frontend Tests

- `LoanBalanceChart.test.tsx` (report): Renders chart with data, handles no data
- `LoanBalanceChart.test.tsx` (dashboard): Widget renders, respects property selection
- Translation coverage tests

## Implementation Order

1. Backend: Add `LOAN_BALANCE` to StatisticKey enum
2. Backend: Implement recalculation logic in PropertyStatisticsService
3. Backend: Add incremental update handlers for LOAN_PRINCIPAL expenses
4. Backend: Unit and E2E tests
5. Frontend: Add `LOAN_BALANCE` to types
6. Frontend: Create report LoanBalanceChart component
7. Frontend: Integrate into PropertyReportCharts
8. Frontend: Create dashboard LoanBalanceChart widget
9. Frontend: Register widget in widget-registry
10. Frontend: Add translations (all 3 languages)
11. Frontend: Component tests
12. Migration: None required (no schema changes)
