# Accounting Module

This module handles financial transactions, expenses, income, and depreciation for properties.

## Structure

```
accounting/
├── transaction/          # Bank transactions (imports, manual entries)
├── expense/              # Expenses and expense types
├── income/               # Income and income types
├── depreciation/         # Asset depreciation calculations
└── accounting.module.ts  # Module registration
```

## Core Concepts

### Transactions
Represents bank transactions imported from CSV or created manually.

**Entity**: `Transaction`
- `status`: PENDING (awaiting review) or ACCEPTED (confirmed)
- `type`: INCOME, EXPENSE, DEPOSIT, WITHDRAW, or UNKNOWN
- `amount`: Positive for income/deposit, negative for expense/withdraw
- `externalId`: Hash-based ID to prevent duplicate imports

**Key Services**:
- `TransactionService` - CRUD operations with ownership checks
- `BalanceService` - Running balance calculations

### Expenses
Tracks property expenses with categorization.

**Entity**: `Expense`
- Linked to property via `propertyId`
- Categorized by `ExpenseType`
- Optionally linked to a `Transaction`

**Entity**: `ExpenseType`
- `isTaxDeductible`: Affects tax calculations
- `isCapitalImprovement`: Triggers depreciation records

### Income
Tracks property income (rent, deposits, etc.).

**Entity**: `Income`
- Linked to property via `propertyId`
- Categorized by `IncomeType`

**Entity**: `IncomeType`
- `isTaxable`: Affects tax calculations

### Depreciation
Handles capital improvement depreciation over time.

**Entity**: `DepreciationAsset`
- Created automatically when expense is marked as capital improvement
- `startDate`, `endDate`: Depreciation period
- `depreciationAmount`: Total amount to depreciate

**Entity**: `DepreciationRecord`
- Individual year's depreciation entry

## Amount Conventions

| Type | Amount Sign |
|------|-------------|
| INCOME | Positive |
| EXPENSE | Negative |
| DEPOSIT | Positive |
| WITHDRAW | Negative |

This allows balance calculation as: `SUM(all transaction amounts)`

## Key Relationships

```
Property ──┬── Transaction ──┬── Expense ── ExpenseType
           │                 └── Income ── IncomeType
           │
           ├── Expense ── DepreciationAsset ── DepreciationRecord
           └── Income
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/accounting/transaction/search` | Search transactions |
| POST | `/accounting/transaction` | Create transaction |
| PUT | `/accounting/transaction/:id` | Update transaction |
| POST | `/accounting/transaction/accept` | Accept pending transactions |
| POST | `/accounting/expense/search` | Search expenses |
| POST | `/accounting/income/search` | Search income |

## Usage Examples

### Creating an expense with transaction
```typescript
const transaction = await transactionService.add(user, {
  type: TransactionType.EXPENSE,
  amount: -100,
  description: 'Repair work',
  propertyId: 1,
  expenses: [{
    description: 'Plumbing repair',
    amount: 100,
    quantity: 1,
    totalAmount: 100,
    expenseTypeId: 1
  }]
});
```

## Related Modules

- **real-estate**: Property entities that transactions belong to
- **import**: CSV import creates transactions in this module
- **auth**: Ownership checks for all operations
