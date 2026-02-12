# Property Report Section Design

**Date:** 2025-02-12
**Status:** Approved

## Overview

Add financial reporting capabilities to property views, showing income, expenses, and visual analytics through charts and expandable transaction tables.

## Navigation Model

### Two Entry Points

1. **Left Menu "Reports"**
   - New menu item in left navigation
   - Uses AppBar's currently selected property
   - Opens dedicated `/report` page
   - If no property selected → shows prompt to select one

2. **PropertyView Integration**
   - Summary cards always visible (replacing "Statistics coming soon" placeholder)
   - "Advanced Reports" button expands/collapses full charts section inline
   - No page navigation - accordion-style reveal
   - Collapsed by default

### Component Reuse

- `<PropertyReportCharts />` component used by both contexts
- Same component, same data, two entry points

## PropertyView Summary Cards

**Layout:** 2x2 grid on desktop, stacked on mobile

| Card | Value | Color |
|------|-------|-------|
| Current Year Income | Sum of income for current year | `success.main` |
| Current Year Expenses | Sum of expenses for current year | `error.main` |
| All-Time Balance | Cumulative balance | `primary.main` |
| All-Time Net Income | Total income - total expenses | `info.main` |

Each card displays:
- Icon + label
- Large formatted currency value

Below cards: **"Advanced Reports"** button to expand charts section

**Data source:** Existing `/real-estate/property/:id/statistics/search` endpoint

## Report Page Structure

```
┌─────────────────────────────────────────────────┐
│ ← Back to Property    Property Name    [2024 ▼] │  Header with year selector
├─────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ Income  │ │ Expense │ │ Balance │ │ Net     │ │  Summary cards
│ │ €12,000 │ │ €8,500  │ │ €45,000 │ │ €3,500  │ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
├─────────────────────────────────────────────────┤
│         Monthly Income vs Expenses              │
│   █ █   █ █   █ █   █ █   █ █   █ █            │  Bar chart
│   Jan   Feb   Mar   Apr   May   Jun   ...       │
├─────────────────────────────────────────────────┤
│         Balance Trend                           │
│   ───────────────────────────────              │  Line chart
├─────────────────────────────────────────────────┤
│  [By Type] [By Category]                        │  Toggle for pie charts
│   🍩 Expenses    🍩 Income                      │  Side-by-side donuts
├─────────────────────────────────────────────────┤
│  Monthly Summary                                │
│  ▶ January    €1,200    €850     €350          │  Expandable rows
│  ▶ February   €1,200    €1,100   €100          │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

**Mobile:** All sections stack vertically, pie charts stack instead of side-by-side.

## Chart Components

### Monthly Bar Chart
- **Library:** Recharts `<BarChart>`
- **X-axis:** Months (Jan-Dec or available months for selected year)
- **Y-axis:** Currency (€)
- **Bars:** Income (green) vs Expenses (red) side-by-side
- **Tooltip:** Shows exact values on hover
- **Empty state:** "No data for this year" message

### Balance Trend Line Chart
- **Library:** Recharts `<LineChart>` or `<AreaChart>`
- **X-axis:** Months
- **Y-axis:** Cumulative balance (€)
- **Line:** Single line showing running balance
- **Fill:** Subtle gradient area below line
- **Reference line:** Zero line if balance goes negative

### Pie/Donut Charts
- **Library:** Recharts `<PieChart>` with inner radius (donut style)
- **Toggle buttons:** "By Type" | "By Transaction Type"
- **By Type view:** ExpenseType breakdown (left donut), IncomeType breakdown (right donut)
- **By Transaction Type view:** Single donut showing INCOME/EXPENSE/DEPOSIT/WITHDRAW proportions
- **Legend:** Below each chart with percentages
- **Center label:** Total amount

## Monthly Summary Table

### Summary Row (collapsed)

| Month | Income | Expenses | Net | Expand |
|-------|--------|----------|-----|--------|
| January 2024 | €1,200 | €850 | €350 | ▶ |

- Net column: green if positive, red if negative
- Click row or arrow to expand

### Expanded Details

```
▼ January 2024          €1,200    €850    €350
  ┌──────────────────────────────────────────┐
  │ 15.01  Rent payment         +€1,200      │
  │ 20.01  Water bill           -€45         │
  │ 22.01  Property management  -€150        │
  │ 28.01  Repairs              -€655        │
  └──────────────────────────────────────────┘
```

- Shows date, description, amount (colored by type)
- Links to full transaction detail if clicked
- Max ~10 items visible, "Show all X transactions" link if more

### Lazy Loading Strategy

- **Initial load:** Only monthly summary totals (from statistics endpoint - already aggregated)
- **On expand:** Fetch transactions for that specific month on-demand
- **Cache:** Keep fetched months in memory while on page (don't re-fetch on collapse/expand)
- **Loading state:** Skeleton/spinner inside expanded area while fetching

## Backend Considerations

### Existing Endpoints (ready to use)
- `POST /real-estate/property/:id/statistics/search` - Monthly/yearly aggregates
- Statistics already calculated and stored by `property-statistics.service.ts`

### New Endpoint Needed

**`POST /real-estate/property/:id/transactions/search`**
- Filter by: year, month, type (optional)
- Returns transactions for the expandable table
- Paginated if needed

### Pie Chart Data
- Calculate on frontend from fetched transactions
- Fetch transactions once, aggregate in React
- Simpler approach, fewer endpoints needed

## File Structure

### New Files to Create

**Components:**
```
frontend/src/components/property/report/
├── PropertyReportSection.tsx      # Container with expand/collapse for PropertyView
├── PropertyReportCharts.tsx       # All charts + table (reusable)
├── PropertySummaryCards.tsx       # 4 summary cards grid
├── MonthlyBarChart.tsx            # Income vs Expenses bars
├── BalanceTrendChart.tsx          # Line/area chart
├── TypeBreakdownCharts.tsx        # Pie charts with toggle
└── MonthlyTransactionTable.tsx    # Expandable accordion table
```

**Pages:**
```
frontend/src/components/property/report/
└── ReportPage.tsx                 # Standalone page for left menu access
```

**Translations:**
```
frontend/src/translations/property/
└── report.ts (or add to existing property translations)
```

### Modified Files
- `PropertyView.tsx` - Replace placeholder with `<PropertySummaryCards>` + `<PropertyReportSection>`
- Left menu component - Add "Reports" menu item
- Router config - Add `/report` route

## Technical Decisions Summary

| Aspect | Decision |
|--------|----------|
| **Location** | Summary cards in PropertyView + expandable charts inline + standalone report page from left menu |
| **Summary data** | Current year totals + all-time totals |
| **Charts** | Monthly bar chart, balance trend line, pie/donut with toggle |
| **Time control** | Year selector dropdown |
| **Pie breakdown** | Toggle between expense/income types and transaction types |
| **Table** | Monthly summary rows, expandable to show transactions |
| **Lazy loading** | Summary loads first, transactions fetched on expand |
| **Mobile** | Vertical stacking |
| **Data source** | Existing statistics endpoints + frontend aggregation for pie charts |
| **New endpoint** | Transaction search by year/month for expandable table |
