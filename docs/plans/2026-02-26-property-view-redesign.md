# PropertyView Redesign

**Date:** 2026-02-26
**Status:** Approved

## Problem Statement

The current PropertyView has several layout issues:
- Poor visual hierarchy - all information appears equally important
- Wasted horizontal space on desktop - sections use only half width
- Typography too large for data-dense content
- Long vertical scrolling required

## Design Goals

1. Dashboard card-based layout with clear visual grouping
2. Key financials prominently displayed at top
3. Smaller, more compact typography throughout
4. Full-width utilization on desktop with multi-column card grids
5. Responsive mobile layout with vertical card stacking
6. Consistent structure across OWN/PROSPECT/SOLD statuses

## Typography System

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Section headers | 12px uppercase | 500 | text.secondary |
| Card titles | 14px | 500 | text.primary |
| Data values | 14px | 600 (numbers) | text.primary |
| Labels | 12px | 400 | text.secondary |
| KPI card values | 20px | 700 | text.primary |
| Card padding | 12px | - | - |

## Layout Structure

### Desktop (md+)

```
┌─────────────────────────────────────────────────────────────┐
│  [Hero Image - 180px height]                    [Ribbon]    │
├─────────────────────────────────────────────────────────────┤
│  ← Back    Property Name                         [⋮ Menu]   │
│            Apartment Type · Rooms                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ KPI Card 1   │ │ KPI Card 2   │ │ KPI Card 3   │         │
│  │ (1/3 width)  │ │ (1/3 width)  │ │ (1/3 width)  │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐ ┌─────────────────────────┐    │
│  │ Info Card (1/2 width)   │ │ Info Card (1/2 width)   │    │
│  └─────────────────────────┘ └─────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  [Status Section - full width]                              │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (xs)

- All cards stack vertically (full width)
- Hero image reduced to 150px
- Same content hierarchy maintained

### Grid Breakpoints

- KPI cards: `xs: 12, sm: 4` (3 columns on tablet+)
- Info cards: `xs: 12, md: 6` (2 columns on desktop)

## KPI Cards by Status

### OWN

| Card | Label | Value | Subtitle |
|------|-------|-------|----------|
| 1 | Purchase Price | €XXX,XXX | + debt share |
| 2 | Monthly Rent | €XXX/mo | Net: €XXX/mo |
| 3 | All-time Balance | €XX,XXX | from statistics |

### PROSPECT

| Card | Label | Value | Subtitle |
|------|-------|-------|----------|
| 1 | Asking Price | €XXX,XXX | + debt share |
| 2 | Expected Rent | €XXX/mo | - |
| 3 | Gross Yield | X.X% | rent×12/price |

### SOLD

| Card | Label | Value | Subtitle |
|------|-------|-------|----------|
| 1 | Purchase Price | €XXX,XXX | - |
| 2 | Sale Price | €XXX,XXX | - |
| 3 | Profit/Loss | ±€XX,XXX | green/red |

## Info Cards

| Card | Content | Shown for |
|------|---------|-----------|
| Property Info | Size, Build year, Price/m² | All |
| Location | Street, City + postal | All (if exists) |
| Monthly Costs | Maintenance, Water, Financial, Total | All (if any) |
| Purchase Details | Date, Loan amount | OWN, SOLD |
| Description | Free text (collapsible) | All (if exists) |

### Card Styling

```typescript
{
  backgroundColor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  p: 1.5,
  // No shadow - flat design
}
```

## New Components

### PropertyKpiCard

```typescript
interface PropertyKpiCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: 'success.main' | 'error.main' | 'text.primary';
}
```

### PropertyInfoCard

```typescript
interface PropertyInfoCardProps {
  title: string;
  children: ReactNode; // DetailRow components
}
```

## Status-Specific Sections

### OWN
- Statistics section with PropertySummaryCards (updated typography)
- Collapsible PropertyReportCharts

### PROSPECT
- ProspectInvestmentSection (updated header styling)

### SOLD
- Statistics section (same as OWN)
- Sale info moved to KPI cards

## Migration Notes

- Remove Divider components between sections
- Replace `variant="body1"` with `variant="body2"` throughout
- Replace section headers with new 12px uppercase style
- Update DetailRow to use caption for labels
- Remove `md: 6` single-column pattern
