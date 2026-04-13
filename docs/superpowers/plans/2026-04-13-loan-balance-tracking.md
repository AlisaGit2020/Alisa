# Loan Balance Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track and visualize property loan payoff over time in statistics, advanced reports, and dashboard widget.

**Architecture:** Add `LOAN_BALANCE` to StatisticKey enum, extend PropertyStatisticsService to calculate running loan balance from `purchaseLoan` minus cumulative `LOAN_PRINCIPAL` expenses, display via line charts in report and dashboard.

**Tech Stack:** NestJS backend, TypeORM, React frontend, recharts, i18next

---

## File Structure

### Backend Files
- `backend/src/common/types.ts` - Add LOAN_BALANCE to StatisticKey enum
- `backend/src/real-estate/property/property-statistics.service.ts` - Add recalculateLoanBalance method
- `backend/src/real-estate/property/property-statistics.service.spec.ts` - Add loan balance tests

### Frontend Files
- `frontend/src/types/common.ts` - Add LOAN_BALANCE to StatisticKey enum
- `frontend/src/components/property/report/LoanBalanceChart.tsx` - New report chart component
- `frontend/src/components/property/report/LoanBalanceChart.test.tsx` - Report chart tests
- `frontend/src/components/property/report/PropertyReportCharts.tsx` - Integrate loan chart
- `frontend/src/components/dashboard/widgets/LoanBalanceChart.tsx` - New dashboard widget
- `frontend/src/components/dashboard/widgets/LoanBalanceChart.test.tsx` - Widget tests
- `frontend/src/components/dashboard/widgets/hooks/useLoanBalanceData.ts` - Data hook
- `frontend/src/components/dashboard/widgets/hooks/useLoanBalanceData.test.ts` - Hook tests
- `frontend/src/components/dashboard/config/widget-registry.ts` - Register widget
- `frontend/src/translations/property/en.ts` - English translations
- `frontend/src/translations/property/fi.ts` - Finnish translations
- `frontend/src/translations/property/sv.ts` - Swedish translations
- `frontend/src/translations/dashboard/en.ts` - Dashboard English
- `frontend/src/translations/dashboard/fi.ts` - Dashboard Finnish
- `frontend/src/translations/dashboard/sv.ts` - Dashboard Swedish

---

### Task 1: Add LOAN_BALANCE to Backend StatisticKey

**Files:**
- Modify: `backend/src/common/types.ts:47-58`

- [ ] **Step 1: Add LOAN_BALANCE to StatisticKey enum**

Open `backend/src/common/types.ts` and add the new enum value:

```typescript
export enum StatisticKey {
  BALANCE = 'balance',
  INCOME = 'income',
  EXPENSE = 'expense',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TAX_GROSS_INCOME = 'tax_gross_income',
  TAX_DEDUCTIONS = 'tax_deductions',
  TAX_DEPRECIATION = 'tax_depreciation',
  TAX_NET_INCOME = 'tax_net_income',
  AIRBNB_VISITS = 'airbnb_visits',
  LOAN_BALANCE = 'loan_balance',
}
```

- [ ] **Step 2: Verify backend compiles**

Run: `cd backend && npm run build`
Expected: Compiles without errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/common/types.ts
git commit -m "$(cat <<'EOF'
feat: add LOAN_BALANCE to StatisticKey enum
EOF
)"
```

---

### Task 2: Add LOAN_BALANCE to Frontend StatisticKey

**Files:**
- Modify: `frontend/src/types/common.ts:43-53`

- [ ] **Step 1: Add LOAN_BALANCE to StatisticKey enum**

Open `frontend/src/types/common.ts` and add the new enum value:

```typescript
export enum StatisticKey {
  BALANCE = 'balance',
  INCOME = 'income',
  EXPENSE = 'expense',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TAX_GROSS_INCOME = 'tax_gross_income',
  TAX_DEDUCTIONS = 'tax_deductions',
  TAX_DEPRECIATION = 'tax_depreciation',
  TAX_NET_INCOME = 'tax_net_income',
  LOAN_BALANCE = 'loan_balance',
}
```

- [ ] **Step 2: Verify frontend compiles**

Run: `cd frontend && npm run build`
Expected: Compiles without errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/common.ts
git commit -m "$(cat <<'EOF'
feat: add LOAN_BALANCE to frontend StatisticKey enum
EOF
)"
```

---

### Task 3: Implement Loan Balance Recalculation - Write Tests First

**Files:**
- Modify: `backend/src/real-estate/property/property-statistics.service.spec.ts`

- [ ] **Step 1: Write failing test for recalculateLoanBalance with valid property**

Add to `property-statistics.service.spec.ts`:

```typescript
describe('recalculateLoanBalance', () => {
  it('calculates loan balance from purchaseLoan minus principal payments', async () => {
    const propertyId = 1;
    const purchaseLoan = 100000;
    const purchaseDate = new Date('2024-01-01');

    // Mock property with loan
    mockDataSource.query
      .mockResolvedValueOnce([{ id: propertyId, purchaseLoan, purchaseDate }]) // properties query
      .mockResolvedValueOnce([ // principal payments query
        { year: 2024, month: 1, total: '1000.00' },
        { year: 2024, month: 2, total: '1000.00' },
        { year: 2024, month: 3, total: '1000.00' },
      ])
      .mockResolvedValue(undefined); // upsert queries

    await service.recalculateLoanBalance(propertyId);

    // Verify statistics were inserted for each month
    const insertCalls = mockDataSource.query.mock.calls.filter(
      (call) => call[0].includes('INSERT INTO property_statistics')
    );
    expect(insertCalls.length).toBeGreaterThan(0);
  });

  it('skips property without purchaseLoan', async () => {
    const propertyId = 1;

    // Mock property without loan
    mockDataSource.query.mockResolvedValueOnce([]);

    await service.recalculateLoanBalance(propertyId);

    // Should only have the initial query, no inserts
    expect(mockDataSource.query).toHaveBeenCalledTimes(1);
  });

  it('ignores payments before purchaseDate', async () => {
    const propertyId = 1;
    const purchaseLoan = 100000;
    const purchaseDate = new Date('2024-03-01');

    // Mock property with loan
    mockDataSource.query
      .mockResolvedValueOnce([{ id: propertyId, purchaseLoan, purchaseDate }])
      .mockResolvedValueOnce([ // Only March payment should be included
        { year: 2024, month: 3, total: '1000.00' },
      ])
      .mockResolvedValue(undefined);

    await service.recalculateLoanBalance(propertyId);

    // Check that the query filters by purchaseDate
    const paymentQuery = mockDataSource.query.mock.calls[1][0];
    expect(paymentQuery).toContain('accountingDate');
  });

  it('stores purchaseLoan as balance when no payments exist', async () => {
    const propertyId = 1;
    const purchaseLoan = 100000;
    const purchaseDate = new Date('2024-01-01');

    mockDataSource.query
      .mockResolvedValueOnce([{ id: propertyId, purchaseLoan, purchaseDate }])
      .mockResolvedValueOnce([]) // No payments
      .mockResolvedValue(undefined);

    await service.recalculateLoanBalance(propertyId);

    // Should still insert an all-time record with the full loan amount
    const insertCalls = mockDataSource.query.mock.calls.filter(
      (call) => call[0].includes('INSERT INTO property_statistics')
    );
    expect(insertCalls.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npm test -- --testPathPattern=property-statistics.service.spec.ts --testNamePattern="recalculateLoanBalance"`
Expected: FAIL with "recalculateLoanBalance is not a function" or similar

- [ ] **Step 3: Commit failing tests**

```bash
git add backend/src/real-estate/property/property-statistics.service.spec.ts
git commit -m "$(cat <<'EOF'
test: add failing tests for recalculateLoanBalance
EOF
)"
```

---

### Task 4: Implement recalculateLoanBalance Method

**Files:**
- Modify: `backend/src/real-estate/property/property-statistics.service.ts`

- [ ] **Step 1: Add recalculateLoanBalance method**

Add to `PropertyStatisticsService` class (after the `recalculate` method):

```typescript
/**
 * Recalculates loan balance statistics for a property.
 * Calculates running balance: purchaseLoan - cumulative LOAN_PRINCIPAL payments.
 * @param propertyId The property ID to recalculate
 */
async recalculateLoanBalance(propertyId: number): Promise<void> {
  const decimals = 2;

  // Delete existing loan_balance statistics for this property
  await this.repository.delete({
    propertyId,
    key: StatisticKey.LOAN_BALANCE,
  });

  // Get property with loan info
  const properties = await this.dataSource.query(
    `SELECT id, "purchaseLoan", "purchaseDate"
     FROM property
     WHERE id = $1 AND "purchaseLoan" IS NOT NULL`,
    [propertyId],
  );

  if (properties.length === 0) {
    return; // No loan to track
  }

  const property = properties[0];
  const purchaseLoan = parseFloat(property.purchaseLoan);
  const purchaseDate = property.purchaseDate;

  // Get monthly LOAN_PRINCIPAL payments grouped by year/month
  const payments = await this.dataSource.query(
    `SELECT
       EXTRACT(YEAR FROM e."accountingDate")::INT as year,
       EXTRACT(MONTH FROM e."accountingDate")::INT as month,
       SUM(e."totalAmount")::TEXT as total
     FROM expense e
     JOIN expense_type et ON et.id = e."expenseTypeId"
     WHERE e."propertyId" = $1
       AND et.key = 'loan-principal'
       AND e."accountingDate" >= $2
     GROUP BY EXTRACT(YEAR FROM e."accountingDate"), EXTRACT(MONTH FROM e."accountingDate")
     ORDER BY year, month`,
    [propertyId, purchaseDate],
  );

  // Calculate running balance for each month
  let runningBalance = purchaseLoan;
  const balanceRecords: Array<{ year: number; month: number; balance: number }> = [];

  for (const payment of payments) {
    const paymentAmount = parseFloat(payment.total) || 0;
    runningBalance = runningBalance - paymentAmount;
    balanceRecords.push({
      year: payment.year,
      month: payment.month,
      balance: runningBalance,
    });
  }

  // Insert monthly records
  for (const record of balanceRecords) {
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      [propertyId, StatisticKey.LOAN_BALANCE, record.year, record.month, record.balance.toFixed(decimals)],
    );
  }

  // Insert yearly records (end-of-year balance)
  const yearlyBalances = new Map<number, number>();
  for (const record of balanceRecords) {
    yearlyBalances.set(record.year, record.balance); // Last month of year wins
  }

  for (const [year, balance] of yearlyBalances) {
    await this.dataSource.query(
      `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
       VALUES ($1, $2, $3, NULL, $4)
       ON CONFLICT ("propertyId", "year", "month", "key")
       DO UPDATE SET "value" = EXCLUDED."value"`,
      [propertyId, StatisticKey.LOAN_BALANCE, year, balance.toFixed(decimals)],
    );
  }

  // Insert all-time record (current balance)
  const currentBalance = balanceRecords.length > 0
    ? balanceRecords[balanceRecords.length - 1].balance
    : purchaseLoan;

  await this.dataSource.query(
    `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
     VALUES ($1, $2, NULL, NULL, $3)
     ON CONFLICT ("propertyId", "year", "month", "key")
     DO UPDATE SET "value" = EXCLUDED."value"`,
    [propertyId, StatisticKey.LOAN_BALANCE, currentBalance.toFixed(decimals)],
  );
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd backend && npm test -- --testPathPattern=property-statistics.service.spec.ts --testNamePattern="recalculateLoanBalance"`
Expected: PASS

- [ ] **Step 3: Commit implementation**

```bash
git add backend/src/real-estate/property/property-statistics.service.ts
git commit -m "$(cat <<'EOF'
feat: implement recalculateLoanBalance method

Calculates running loan balance from purchaseLoan minus cumulative
LOAN_PRINCIPAL payments. Stores monthly, yearly, and all-time snapshots.
EOF
)"
```

---

### Task 5: Integrate Loan Balance into recalculate Method

**Files:**
- Modify: `backend/src/real-estate/property/property-statistics.service.ts`

- [ ] **Step 1: Add loan balance recalculation to the main recalculate method**

Find the `recalculate` method and add loan balance recalculation at the end, before `getRecalculateSummary`:

```typescript
// In the recalculate method, add after the WITHDRAW recalculation and before the summary:

// Recalculate LOAN_BALANCE for properties with loans
await this.recalculateLoanBalanceStatistics(propertyId);
```

- [ ] **Step 2: Add the helper method for batch recalculation**

Add this method to the service (can be private):

```typescript
/**
 * Recalculates loan balance for all properties (or a specific property) with loans.
 */
private async recalculateLoanBalanceStatistics(propertyId?: number): Promise<void> {
  const propertyFilter = propertyId ? 'AND id = $1' : '';
  const params = propertyId ? [propertyId] : [];

  // Get all properties with loans
  const properties = await this.dataSource.query(
    `SELECT id FROM property WHERE "purchaseLoan" IS NOT NULL ${propertyFilter}`,
    params,
  );

  for (const property of properties) {
    await this.recalculateLoanBalance(property.id);
  }
}
```

- [ ] **Step 3: Run all property statistics tests**

Run: `cd backend && npm test -- --testPathPattern=property-statistics.service.spec.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add backend/src/real-estate/property/property-statistics.service.ts
git commit -m "$(cat <<'EOF'
feat: integrate loan balance into statistics recalculation
EOF
)"
```

---

### Task 6: Add Translations for Property Report

**Files:**
- Modify: `frontend/src/translations/property/en.ts`
- Modify: `frontend/src/translations/property/fi.ts`
- Modify: `frontend/src/translations/property/sv.ts`

- [ ] **Step 1: Add English translations**

Add to the `report` object in `frontend/src/translations/property/en.ts`:

```typescript
// Add these keys inside the report object:
loanBalance: 'Loan Balance',
originalLoan: 'Original Loan',
remainingBalance: 'Remaining',
noLoanData: 'No loan data',
```

- [ ] **Step 2: Add Finnish translations**

Add to the `report` object in `frontend/src/translations/property/fi.ts`:

```typescript
// Add these keys inside the report object:
loanBalance: 'Lainasaldo',
originalLoan: 'Alkuperäinen laina',
remainingBalance: 'Jäljellä',
noLoanData: 'Ei lainatietoja',
```

- [ ] **Step 3: Add Swedish translations**

Add to the `report` object in `frontend/src/translations/property/sv.ts`:

```typescript
// Add these keys inside the report object:
loanBalance: 'Lånesaldo',
originalLoan: 'Ursprungligt lån',
remainingBalance: 'Kvar',
noLoanData: 'Inga låneuppgifter',
```

- [ ] **Step 4: Run translation tests**

Run: `cd frontend && npm test -- --testPathPattern=translation`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/translations/property/en.ts frontend/src/translations/property/fi.ts frontend/src/translations/property/sv.ts
git commit -m "$(cat <<'EOF'
feat: add loan balance translations for property report
EOF
)"
```

---

### Task 7: Add Translations for Dashboard

**Files:**
- Modify: `frontend/src/translations/dashboard/en.ts`
- Modify: `frontend/src/translations/dashboard/fi.ts`
- Modify: `frontend/src/translations/dashboard/sv.ts`

- [ ] **Step 1: Add English translations**

Add to `frontend/src/translations/dashboard/en.ts`:

```typescript
// Add these keys to the dashboard object:
loanBalance: "Loan Balance",
noLoanData: "No loan data",
```

- [ ] **Step 2: Add Finnish translations**

Add to `frontend/src/translations/dashboard/fi.ts`:

```typescript
// Add these keys to the dashboard object:
loanBalance: "Lainasaldo",
noLoanData: "Ei lainatietoja",
```

- [ ] **Step 3: Add Swedish translations**

Add to `frontend/src/translations/dashboard/sv.ts`:

```typescript
// Add these keys to the dashboard object:
loanBalance: "Lånesaldo",
noLoanData: "Inga låneuppgifter",
```

- [ ] **Step 4: Run translation tests**

Run: `cd frontend && npm test -- --testPathPattern=translation`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/translations/dashboard/en.ts frontend/src/translations/dashboard/fi.ts frontend/src/translations/dashboard/sv.ts
git commit -m "$(cat <<'EOF'
feat: add loan balance translations for dashboard
EOF
)"
```

---

### Task 8: Create Report LoanBalanceChart Component - Write Test First

**Files:**
- Create: `frontend/src/components/property/report/LoanBalanceChart.test.tsx`

- [ ] **Step 1: Write failing tests for LoanBalanceChart**

Create `frontend/src/components/property/report/LoanBalanceChart.test.tsx`:

```typescript
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test-utils/test-wrapper";
import LoanBalanceChart from "./LoanBalanceChart";

describe("LoanBalanceChart", () => {
  const mockData = [
    { label: "Jan", month: 1, balance: 100000 },
    { label: "Feb", month: 2, balance: 99000 },
    { label: "Mar", month: 3, balance: 98000 },
  ];

  it("renders chart title", () => {
    renderWithProviders(
      <LoanBalanceChart data={mockData} originalLoan={100000} loading={false} />
    );

    expect(screen.getByText("Loan Balance")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading", () => {
    renderWithProviders(
      <LoanBalanceChart data={[]} originalLoan={100000} loading={true} />
    );

    expect(screen.queryByText("Loan Balance")).not.toBeInTheDocument();
  });

  it("shows no data message when no loan data", () => {
    renderWithProviders(
      <LoanBalanceChart data={[]} originalLoan={null} loading={false} />
    );

    expect(screen.getByText("No loan data")).toBeInTheDocument();
  });

  it("displays remaining balance chip", () => {
    renderWithProviders(
      <LoanBalanceChart data={mockData} originalLoan={100000} loading={false} />
    );

    // The chip should show the current (last) balance
    expect(screen.getByText(/98.*000/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --testPathPattern=LoanBalanceChart.test.tsx`
Expected: FAIL with "Cannot find module './LoanBalanceChart'"

- [ ] **Step 3: Commit failing tests**

```bash
git add frontend/src/components/property/report/LoanBalanceChart.test.tsx
git commit -m "$(cat <<'EOF'
test: add failing tests for LoanBalanceChart component
EOF
)"
```

---

### Task 9: Implement Report LoanBalanceChart Component

**Files:**
- Create: `frontend/src/components/property/report/LoanBalanceChart.tsx`

- [ ] **Step 1: Create LoanBalanceChart component**

Create `frontend/src/components/property/report/LoanBalanceChart.tsx`:

```typescript
import { useTheme } from "@mui/material/styles";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Box, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export interface LoanBalanceDataPoint {
  label: string;
  month: number;
  balance: number;
}

interface LoanBalanceChartProps {
  data: LoanBalanceDataPoint[];
  originalLoan: number | null;
  loading?: boolean;
  height?: number;
}

function LoanBalanceChart({
  data,
  originalLoan,
  loading = false,
  height = 300,
}: LoanBalanceChartProps) {
  const theme = useTheme();
  const { t } = useTranslation("property");

  const currentBalance = useMemo(() => {
    if (data.length === 0) return originalLoan ?? 0;
    return data[data.length - 1].balance;
  }, [data, originalLoan]);

  const chartData = useMemo(() => {
    if (!originalLoan) return data;
    // Add original loan as first point if we have data
    if (data.length > 0) {
      return [{ label: t("report.originalLoan"), month: 0, balance: originalLoan }, ...data];
    }
    return data;
  }, [data, originalLoan, t]);

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={height} />
      </Paper>
    );
  }

  if (!originalLoan) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t("report.loanBalance")}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: height,
          }}
        >
          <Typography color="text.secondary">
            {t("report.noLoanData")}
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h6">{t("report.loanBalance")}</Typography>
        <Chip
          label={`${t("report.remainingBalance")}: ${currentBalance.toLocaleString()} €`}
          size="small"
          sx={{
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
            fontWeight: "bold",
          }}
        />
      </Stack>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.palette.divider}
          />
          <XAxis
            dataKey="label"
            stroke={theme.palette.text.secondary}
            style={theme.typography.body2}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            style={theme.typography.body2}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toLocaleString()} €`, t("report.loanBalance")]}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              borderColor: theme.palette.divider,
            }}
            labelStyle={{ color: theme.palette.text.primary }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke={theme.palette.warning.main}
            strokeWidth={2}
            dot={{ fill: theme.palette.warning.main, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}

export default LoanBalanceChart;
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPattern=LoanBalanceChart.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/property/report/LoanBalanceChart.tsx
git commit -m "$(cat <<'EOF'
feat: implement LoanBalanceChart component for property reports
EOF
)"
```

---

### Task 10: Integrate LoanBalanceChart into PropertyReportCharts

**Files:**
- Modify: `frontend/src/components/property/report/PropertyReportCharts.tsx`

- [ ] **Step 1: Import LoanBalanceChart and add state**

Add imports at the top:

```typescript
import LoanBalanceChart, { LoanBalanceDataPoint } from "./LoanBalanceChart";
import { Property } from "@asset-types";
```

Add state variables inside the component:

```typescript
const [property, setProperty] = useState<Property | null>(null);
const [loanStatistics, setLoanStatistics] = useState<PropertyStatistics[]>([]);
```

- [ ] **Step 2: Add useEffect to fetch property details**

Add this useEffect:

```typescript
// Fetch property details for loan info
useEffect(() => {
  const fetchProperty = async () => {
    try {
      const url = `${VITE_API_URL}/real-estate/property/${propertyId}`;
      const options = await ApiClient.getOptions();
      const response = await axios.get<Property>(url, options);
      setProperty(response.data);
    } catch (error) {
      console.error("Failed to fetch property:", error);
      setProperty(null);
    }
  };

  if (propertyId) {
    fetchProperty();
  }
}, [propertyId]);
```

- [ ] **Step 3: Add useEffect to fetch loan statistics**

Add this useEffect:

```typescript
// Fetch loan balance statistics
useEffect(() => {
  const fetchLoanStatistics = async () => {
    if (!property?.purchaseLoan) {
      setLoanStatistics([]);
      return;
    }

    try {
      const url = `${VITE_API_URL}/real-estate/property/${propertyId}/statistics/search`;
      const options = await ApiClient.getOptions();
      const response = await axios.post<PropertyStatistics[]>(
        url,
        { key: "loan_balance", year: selectedYear, includeMonthly: true },
        options
      );
      setLoanStatistics(response.data);
    } catch (error) {
      console.error("Failed to fetch loan statistics:", error);
      setLoanStatistics([]);
    }
  };

  fetchLoanStatistics();
}, [propertyId, selectedYear, property?.purchaseLoan]);
```

- [ ] **Step 4: Add memo for loan balance data**

Add this useMemo:

```typescript
// Transform loan statistics to chart data
const loanBalanceData: LoanBalanceDataPoint[] = useMemo(() => {
  const dataPoints: LoanBalanceDataPoint[] = MONTH_LABELS.map((label, index) => ({
    label,
    month: index + 1,
    balance: 0,
  }));

  loanStatistics.forEach((stat) => {
    if (stat.month && stat.year === selectedYear && stat.key === "loan_balance") {
      const monthIndex = stat.month - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        dataPoints[monthIndex].balance = parseFloat(stat.value) || 0;
      }
    }
  });

  // Filter to only months with data
  return dataPoints.filter((dp) => dp.balance > 0);
}, [loanStatistics, selectedYear]);
```

- [ ] **Step 5: Add LoanBalanceChart to render**

Add the chart component in the Stack, after BalanceTrendChart:

```typescript
{/* Loan Balance Chart */}
<LoanBalanceChart
  data={loanBalanceData}
  originalLoan={property?.purchaseLoan ?? null}
  loading={loadingStats}
/>
```

- [ ] **Step 6: Verify frontend compiles**

Run: `cd frontend && npm run build`
Expected: Compiles without errors

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/property/report/PropertyReportCharts.tsx
git commit -m "$(cat <<'EOF'
feat: integrate LoanBalanceChart into property reports
EOF
)"
```

---

### Task 11: Create useLoanBalanceData Hook - Write Test First

**Files:**
- Create: `frontend/src/components/dashboard/widgets/hooks/useLoanBalanceData.test.ts`

- [ ] **Step 1: Write failing tests for useLoanBalanceData hook**

Create `frontend/src/components/dashboard/widgets/hooks/useLoanBalanceData.test.ts`:

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useLoanBalanceData } from "./useLoanBalanceData";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("@asset-lib/api-client", () => ({
  __esModule: true,
  default: {
    getOptions: jest.fn().mockResolvedValue({ headers: {} }),
  },
}));

jest.mock("../../context/DashboardContext", () => ({
  useDashboard: () => ({
    selectedPropertyId: null,
    viewMode: "monthly" as const,
    selectedYear: 2024,
    refreshKey: 0,
  }),
}));

describe("useLoanBalanceData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns loading state initially", () => {
    mockedAxios.post.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useLoanBalanceData());

    expect(result.current.loading).toBe(true);
  });

  it("returns loan balance data", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        { propertyId: 1, key: "loan_balance", year: 2024, month: 1, value: "99000.00" },
        { propertyId: 1, key: "loan_balance", year: 2024, month: 2, value: "98000.00" },
      ],
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ id: 1, purchaseLoan: 100000 }],
    });

    const { result } = renderHook(() => useLoanBalanceData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.length).toBeGreaterThan(0);
    expect(result.current.originalLoan).toBe(100000);
  });

  it("handles empty data", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: [] });
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useLoanBalanceData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual([]);
    expect(result.current.originalLoan).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --testPathPattern=useLoanBalanceData.test.ts`
Expected: FAIL with "Cannot find module './useLoanBalanceData'"

- [ ] **Step 3: Commit failing tests**

```bash
git add frontend/src/components/dashboard/widgets/hooks/useLoanBalanceData.test.ts
git commit -m "$(cat <<'EOF'
test: add failing tests for useLoanBalanceData hook
EOF
)"
```

---

### Task 12: Implement useLoanBalanceData Hook

**Files:**
- Create: `frontend/src/components/dashboard/widgets/hooks/useLoanBalanceData.ts`

- [ ] **Step 1: Create useLoanBalanceData hook**

Create `frontend/src/components/dashboard/widgets/hooks/useLoanBalanceData.ts`:

```typescript
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import ApiClient from "@asset-lib/api-client";
import { Property, PropertyStatistics } from "@asset-types";
import { useDashboard, ViewMode } from "../../context/DashboardContext";
import { VITE_API_URL } from "../../../../constants";

export interface LoanBalanceDataPoint {
  label: string;
  balance: number;
  month?: number;
  year?: number;
}

interface UseLoanBalanceDataResult {
  data: LoanBalanceDataPoint[];
  originalLoan: number;
  currentBalance: number;
  loading: boolean;
  error: string | null;
}

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

async function fetchLoanStatistics(
  propertyId: number | null,
  viewMode: ViewMode,
  year: number
): Promise<PropertyStatistics[]> {
  const url = `${VITE_API_URL}/real-estate/property/statistics/search`;
  const options = await ApiClient.getOptions();

  const body: Record<string, unknown> = {
    key: "loan_balance",
  };

  if (propertyId) {
    body.propertyId = propertyId;
  }

  if (viewMode === "monthly") {
    body.year = year;
    body.includeMonthly = true;
  } else {
    body.includeYearly = true;
  }

  const response = await axios.post<PropertyStatistics[]>(url, body, options);
  return response.data;
}

async function fetchProperties(propertyId: number | null): Promise<Property[]> {
  const url = propertyId
    ? `${VITE_API_URL}/real-estate/property/${propertyId}`
    : `${VITE_API_URL}/real-estate/property/search`;
  const options = await ApiClient.getOptions();

  if (propertyId) {
    const response = await axios.get<Property>(url, options);
    return [response.data];
  } else {
    const response = await axios.post<Property[]>(url, {}, options);
    return response.data;
  }
}

function aggregateLoanData(
  statistics: PropertyStatistics[],
  viewMode: ViewMode,
  year: number
): LoanBalanceDataPoint[] {
  if (viewMode === "monthly") {
    const dataPoints: LoanBalanceDataPoint[] = [];

    // Group by month, sum across properties
    const monthMap = new Map<number, number>();

    statistics.forEach((stat) => {
      if (stat.month && stat.year === year) {
        const current = monthMap.get(stat.month) || 0;
        monthMap.set(stat.month, current + (parseFloat(stat.value) || 0));
      }
    });

    monthMap.forEach((balance, month) => {
      dataPoints.push({
        label: monthLabels[month - 1],
        month,
        year,
        balance,
      });
    });

    return dataPoints.sort((a, b) => (a.month ?? 0) - (b.month ?? 0));
  } else {
    // Yearly view
    const yearMap = new Map<number, number>();
    const currentYear = new Date().getFullYear();

    statistics.forEach((stat) => {
      if (stat.year && !stat.month) {
        const current = yearMap.get(stat.year) || 0;
        yearMap.set(stat.year, current + (parseFloat(stat.value) || 0));
      }
    });

    const dataPoints: LoanBalanceDataPoint[] = [];
    yearMap.forEach((balance, y) => {
      if (y >= currentYear - 4 && y <= currentYear) {
        dataPoints.push({
          label: String(y),
          year: y,
          balance,
        });
      }
    });

    return dataPoints.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  }
}

export function useLoanBalanceData(): UseLoanBalanceDataResult {
  const { selectedPropertyId, viewMode, selectedYear, refreshKey } = useDashboard();
  const [data, setData] = useState<LoanBalanceDataPoint[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statistics, props] = await Promise.all([
          fetchLoanStatistics(selectedPropertyId, viewMode, selectedYear),
          fetchProperties(selectedPropertyId),
        ]);

        if (!cancelled) {
          const aggregated = aggregateLoanData(statistics, viewMode, selectedYear);
          setData(aggregated);
          setProperties(props);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load loan balance data");
          console.error("Error loading loan balance data:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [selectedPropertyId, viewMode, selectedYear, refreshKey]);

  const originalLoan = useMemo(() => {
    return properties.reduce((sum, p) => sum + (p.purchaseLoan ?? 0), 0);
  }, [properties]);

  const currentBalance = useMemo(() => {
    if (data.length === 0) return originalLoan;
    return data[data.length - 1].balance;
  }, [data, originalLoan]);

  return { data, originalLoan, currentBalance, loading, error };
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPattern=useLoanBalanceData.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/widgets/hooks/useLoanBalanceData.ts
git commit -m "$(cat <<'EOF'
feat: implement useLoanBalanceData hook for dashboard widget
EOF
)"
```

---

### Task 13: Create Dashboard LoanBalanceChart Widget - Write Test First

**Files:**
- Create: `frontend/src/components/dashboard/widgets/LoanBalanceChart.test.tsx`

- [ ] **Step 1: Write failing tests for dashboard LoanBalanceChart**

Create `frontend/src/components/dashboard/widgets/LoanBalanceChart.test.tsx`:

```typescript
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test-utils/test-wrapper";
import LoanBalanceChart from "./LoanBalanceChart";

jest.mock("./hooks/useLoanBalanceData", () => ({
  useLoanBalanceData: () => ({
    data: [
      { label: "Jan", month: 1, balance: 99000 },
      { label: "Feb", month: 2, balance: 98000 },
    ],
    originalLoan: 100000,
    currentBalance: 98000,
    loading: false,
    error: null,
  }),
}));

describe("LoanBalanceChart (Dashboard)", () => {
  it("renders chart title", () => {
    renderWithProviders(<LoanBalanceChart />);

    expect(screen.getByText("Loan Balance")).toBeInTheDocument();
  });

  it("displays current balance chip", () => {
    renderWithProviders(<LoanBalanceChart />);

    expect(screen.getByText(/98.*000/)).toBeInTheDocument();
  });
});

describe("LoanBalanceChart loading state", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("shows loading spinner", async () => {
    jest.doMock("./hooks/useLoanBalanceData", () => ({
      useLoanBalanceData: () => ({
        data: [],
        originalLoan: 0,
        currentBalance: 0,
        loading: true,
        error: null,
      }),
    }));

    const { default: LoanBalanceChartLoading } = await import("./LoanBalanceChart");
    renderWithProviders(<LoanBalanceChartLoading />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

describe("LoanBalanceChart no data state", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("shows no data message when no loan", async () => {
    jest.doMock("./hooks/useLoanBalanceData", () => ({
      useLoanBalanceData: () => ({
        data: [],
        originalLoan: 0,
        currentBalance: 0,
        loading: false,
        error: null,
      }),
    }));

    const { default: LoanBalanceChartNoData } = await import("./LoanBalanceChart");
    renderWithProviders(<LoanBalanceChartNoData />);

    expect(screen.getByText("No loan data")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --testPathPattern="LoanBalanceChart.test.tsx" --testPathIgnorePatterns="property/report"`
Expected: FAIL with "Cannot find module './LoanBalanceChart'"

- [ ] **Step 3: Commit failing tests**

```bash
git add frontend/src/components/dashboard/widgets/LoanBalanceChart.test.tsx
git commit -m "$(cat <<'EOF'
test: add failing tests for dashboard LoanBalanceChart widget
EOF
)"
```

---

### Task 14: Implement Dashboard LoanBalanceChart Widget

**Files:**
- Create: `frontend/src/components/dashboard/widgets/LoanBalanceChart.tsx`

- [ ] **Step 1: Create LoanBalanceChart widget**

Create `frontend/src/components/dashboard/widgets/LoanBalanceChart.tsx`:

```typescript
import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Title from "../../Title";
import { useLoanBalanceData } from "./hooks/useLoanBalanceData";

function LoanBalanceChart() {
  const theme = useTheme();
  const { t } = useTranslation("dashboard");
  const { data, originalLoan, currentBalance, loading, error } = useLoanBalanceData();

  const chartData = useMemo(() => {
    if (originalLoan > 0 && data.length > 0) {
      // Prepend original loan as starting point
      return [{ label: "Start", balance: originalLoan }, ...data];
    }
    return data;
  }, [data, originalLoan]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (originalLoan === 0) {
    return (
      <>
        <Title>{t("loanBalance")}</Title>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <Typography color="text.secondary" variant="body2">{t("noLoanData")}</Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Title>{t("loanBalance")}</Title>
        <Chip
          label={`${currentBalance.toLocaleString()} €`}
          size="small"
          sx={{
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
            fontWeight: "bold",
          }}
        />
      </Stack>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="label"
            stroke={theme.palette.text.secondary}
            style={theme.typography.caption}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            style={theme.typography.caption}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toLocaleString()} €`, t("loanBalance")]}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              borderColor: theme.palette.divider,
            }}
            labelStyle={{ color: theme.palette.text.primary }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke={theme.palette.warning.main}
            strokeWidth={2}
            dot={{ fill: theme.palette.warning.main, strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

export default LoanBalanceChart;
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPattern="widgets/LoanBalanceChart.test.tsx"`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/widgets/LoanBalanceChart.tsx
git commit -m "$(cat <<'EOF'
feat: implement LoanBalanceChart dashboard widget
EOF
)"
```

---

### Task 15: Register Widget in Widget Registry

**Files:**
- Modify: `frontend/src/components/dashboard/config/widget-registry.ts`

- [ ] **Step 1: Import LoanBalanceChart**

Add import at the top:

```typescript
import LoanBalanceChart from "../widgets/LoanBalanceChart";
```

- [ ] **Step 2: Add widget to registry**

Add to WIDGET_REGISTRY array:

```typescript
{
  id: "loanBalance",
  component: LoanBalanceChart,
  translationKey: "loanBalance",
  defaultSize: "1/2",
  height: 300,
},
```

- [ ] **Step 3: Verify frontend compiles and tests pass**

Run: `cd frontend && npm run build && npm test -- --testPathPattern=widget-registry`
Expected: Compiles and tests pass

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/dashboard/config/widget-registry.ts
git commit -m "$(cat <<'EOF'
feat: register LoanBalanceChart in widget registry
EOF
)"
```

---

### Task 16: Run All Tests and Verify

**Files:** None (verification only)

- [ ] **Step 1: Run all backend tests**

Run: `cd backend && npm test`
Expected: All tests pass

- [ ] **Step 2: Run all frontend tests**

Run: `cd frontend && npm test`
Expected: All tests pass

- [ ] **Step 3: Build both projects**

Run: `cd backend && npm run build && cd ../frontend && npm run build`
Expected: Both compile successfully

- [ ] **Step 4: Final commit with all changes**

If there are any uncommitted changes:

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: final cleanup for loan balance tracking feature
EOF
)"
```

---

## Summary

This plan implements:
1. **Backend:** LOAN_BALANCE StatisticKey, recalculateLoanBalance method integrated into statistics recalculation
2. **Frontend Report:** LoanBalanceChart component showing loan payoff curve per property
3. **Frontend Dashboard:** LoanBalanceChart widget with useLoanBalanceData hook
4. **Translations:** All 3 languages for both property reports and dashboard

Total: 16 tasks with TDD approach throughout.
