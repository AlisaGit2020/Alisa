# Real Estate Module

This module manages properties, investments, ownership, and financial statistics.

## Structure

```
real-estate/
├── property/              # Property management
│   ├── entities/
│   │   ├── property.entity.ts
│   │   └── property-statistics.entity.ts
│   ├── dtos/
│   ├── property.service.ts
│   ├── property-statistics.service.ts
│   ├── property-statistics-schema.service.ts
│   ├── tax.service.ts
│   └── *.controller.ts
├── investment/            # Investment tracking
│   ├── entities/
│   ├── classes/          # Investment calculator
│   └── investment.service.ts
└── real-estate.module.ts
```

## Core Concepts

### Properties
Central entity that all financial data is linked to.

**Entity**: `Property`
- `name`, `size`, `address`, `city`, `postalCode`
- `buildYear`, `apartmentType`, `photo`
- Related: `ownerships`, `transactions`, `expenses`, `incomes`

### Property Statistics
Pre-calculated statistics for dashboard and reports.

**Entity**: `PropertyStatistics`
- `propertyId`, `year`, `month`
- `key`: StatisticKey (BALANCE, INCOME, EXPENSE, etc.)
- `value`: Positive number (type indicated by key)

Statistics are recalculated on transaction changes via events.

### Investments
Tracks investment parameters for return calculations.

**Entity**: `Investment`
- `purchasePrice`, `additionalCosts`
- `monthlyRent`, `operatingCosts`
- `loanAmount`, `interestRate`, `loanTermYears`

**InvestmentCalculator**
Calculates investment metrics:
- Cash-on-cash return
- Total investment return
- Monthly cash flow
- Loan payment breakdown

### Ownership
Defined in `people/ownership/` but managed via Property:

**Entity**: `Ownership`
- `userId`, `propertyId`, `share` (percentage)

Users can have partial ownership (e.g., 50% share).

## API Endpoints

### Property
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/real-estate/property/search` | Search properties |
| GET | `/real-estate/property/:id` | Get property |
| POST | `/real-estate/property` | Create property |
| PUT | `/real-estate/property/:id` | Update property |
| DELETE | `/real-estate/property/:id` | Delete property |

### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/real-estate/property/statistics/search` | Get statistics |

### Tax
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/real-estate/property/tax/calculate` | Calculate tax data |

### Investment
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/real-estate/investment/:propertyId` | Get investment |
| POST | `/real-estate/investment` | Create/update investment |

## Statistics Schema

Statistics use positive values with the `key` field indicating type:

| Key | Description |
|-----|-------------|
| `balance` | Running balance |
| `income` | Total income |
| `expense` | Total expenses |
| `deposit` | Total deposits |
| `withdraw` | Total withdrawals |
| `tax_gross_income` | Taxable gross income |
| `tax_deductions` | Tax-deductible expenses |
| `tax_depreciation` | Depreciation deductions |
| `tax_net_income` | Net taxable income |

## Tax Calculation

The `TaxService` calculates Finnish rental property tax:
- Gross income from taxable income types
- Deductions from tax-deductible expense types
- Depreciation from capital improvements
- Net income = Gross - Deductions - Depreciation

## Usage Examples

### Creating a property with ownership
```typescript
const property = await propertyService.add(user, {
  name: 'My Apartment',
  size: 50,
  city: 'Helsinki',
  ownerships: [{ share: 100 }]  // 100% ownership for current user
});
```

### Getting property statistics
```typescript
const stats = await propertyStatisticsService.search(user, {
  where: {
    propertyId: 1,
    year: 2024
  }
});
```

## Events

The module listens for transaction events to update statistics:
- Transaction created → recalculate affected month
- Transaction updated → recalculate old and new months
- Transaction deleted → recalculate affected month

## Related Modules

- **accounting**: All transactions, expenses, income linked to properties
- **people**: User ownership management
- **auth**: Property-based access control
