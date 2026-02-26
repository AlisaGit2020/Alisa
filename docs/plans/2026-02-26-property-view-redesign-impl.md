# PropertyView Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign PropertyView with dashboard card layout, KPI cards, improved typography, and responsive grid.

**Architecture:** Create two new reusable card components (PropertyKpiCard, PropertyInfoCard), update DetailRow for compact typography, refactor PropertyView to use card-based layout with 3-column KPI row and 2-column info grid.

**Tech Stack:** React, Material-UI (Box, Grid, Paper, Typography), existing Asset components

---

## Task 1: Create PropertyKpiCard Component

**Files:**
- Create: `frontend/src/components/property/shared/PropertyKpiCard.tsx`
- Create: `frontend/src/components/property/shared/PropertyKpiCard.test.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/src/components/property/shared/PropertyKpiCard.test.tsx
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import PaymentsIcon from '@mui/icons-material/Payments';
import PropertyKpiCard from './PropertyKpiCard';

describe('PropertyKpiCard', () => {
  it('renders label and value', () => {
    renderWithProviders(
      <PropertyKpiCard
        icon={<PaymentsIcon />}
        label="Purchase Price"
        value="€185,000"
      />
    );

    expect(screen.getByText('Purchase Price')).toBeInTheDocument();
    expect(screen.getByText('€185,000')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    renderWithProviders(
      <PropertyKpiCard
        icon={<PaymentsIcon />}
        label="Purchase Price"
        value="€185,000"
        subtitle="+ €15,000 debt"
      />
    );

    expect(screen.getByText('+ €15,000 debt')).toBeInTheDocument();
  });

  it('applies custom value color', () => {
    renderWithProviders(
      <PropertyKpiCard
        icon={<PaymentsIcon />}
        label="Profit"
        value="+€25,000"
        valueColor="success.main"
      />
    );

    const valueElement = screen.getByText('+€25,000');
    expect(valueElement).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    renderWithProviders(
      <PropertyKpiCard
        icon={<PaymentsIcon />}
        label="Price"
        value="€100"
      />
    );

    // Only label and value should be present
    expect(screen.queryByText('+ €')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern="PropertyKpiCard" --watchAll=false`
Expected: FAIL with "Cannot find module './PropertyKpiCard'"

**Step 3: Write minimal implementation**

```typescript
// frontend/src/components/property/shared/PropertyKpiCard.tsx
import { Box, Paper, Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface PropertyKpiCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: 'success.main' | 'error.main' | 'text.primary';
}

function PropertyKpiCard({
  icon,
  label,
  value,
  subtitle,
  valueColor = 'text.primary',
}: PropertyKpiCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Box sx={{ color: 'text.secondary', mr: 1, display: 'flex' }}>
          {icon}
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.75rem',
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: '1.25rem',
          color: valueColor,
        }}
      >
        {value}
      </Typography>
      {subtitle && (
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
        >
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}

export default PropertyKpiCard;
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --testPathPattern="PropertyKpiCard" --watchAll=false`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/property/shared/PropertyKpiCard.tsx frontend/src/components/property/shared/PropertyKpiCard.test.tsx
git commit -m "feat: add PropertyKpiCard component for dashboard KPIs"
```

---

## Task 2: Create PropertyInfoCard Component

**Files:**
- Create: `frontend/src/components/property/shared/PropertyInfoCard.tsx`
- Create: `frontend/src/components/property/shared/PropertyInfoCard.test.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/src/components/property/shared/PropertyInfoCard.test.tsx
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import PropertyInfoCard from './PropertyInfoCard';

describe('PropertyInfoCard', () => {
  it('renders title and children', () => {
    renderWithProviders(
      <PropertyInfoCard title="Property Info">
        <div>Child content</div>
      </PropertyInfoCard>
    );

    expect(screen.getByText('Property Info')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders title in uppercase', () => {
    renderWithProviders(
      <PropertyInfoCard title="Location">
        <span>Address here</span>
      </PropertyInfoCard>
    );

    const title = screen.getByText('Location');
    expect(title).toHaveStyle({ textTransform: 'uppercase' });
  });

  it('renders multiple children', () => {
    renderWithProviders(
      <PropertyInfoCard title="Details">
        <div>Row 1</div>
        <div>Row 2</div>
        <div>Row 3</div>
      </PropertyInfoCard>
    );

    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('Row 2')).toBeInTheDocument();
    expect(screen.getByText('Row 3')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern="PropertyInfoCard" --watchAll=false`
Expected: FAIL with "Cannot find module './PropertyInfoCard'"

**Step 3: Write minimal implementation**

```typescript
// frontend/src/components/property/shared/PropertyInfoCard.tsx
import { Box, Paper, Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface PropertyInfoCardProps {
  title: string;
  children: ReactNode;
}

function PropertyInfoCard({ title, children }: PropertyInfoCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        height: '100%',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: '0.75rem',
          fontWeight: 500,
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Box>{children}</Box>
    </Paper>
  );
}

export default PropertyInfoCard;
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --testPathPattern="PropertyInfoCard" --watchAll=false`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/property/shared/PropertyInfoCard.tsx frontend/src/components/property/shared/PropertyInfoCard.test.tsx
git commit -m "feat: add PropertyInfoCard component for grouped info"
```

---

## Task 3: Update DetailRow for Compact Typography

**Files:**
- Modify: `frontend/src/components/property/shared/DetailRow.tsx`

**Step 1: Write the failing test**

Add to existing test file or create one:

```typescript
// frontend/src/components/property/shared/DetailRow.test.tsx
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import HomeIcon from '@mui/icons-material/Home';
import DetailRow from './DetailRow';

describe('DetailRow', () => {
  it('renders icon, label and value', () => {
    renderWithProviders(
      <DetailRow
        icon={<HomeIcon data-testid="icon" />}
        label="Size"
        value="45 m²"
      />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('45 m²')).toBeInTheDocument();
  });

  it('renders without icon when not provided', () => {
    renderWithProviders(
      <DetailRow
        label="Size"
        value="45 m²"
      />
    );

    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('45 m²')).toBeInTheDocument();
  });

  it('uses compact typography', () => {
    renderWithProviders(
      <DetailRow
        label="Size"
        value="45 m²"
      />
    );

    const label = screen.getByText('Size');
    const value = screen.getByText('45 m²');

    // Label should be caption size (12px = 0.75rem)
    expect(label).toHaveStyle({ fontSize: '0.75rem' });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern="DetailRow" --watchAll=false`
Expected: FAIL (test for icon optional will fail, compact typography will fail)

**Step 3: Update implementation**

```typescript
// frontend/src/components/property/shared/DetailRow.tsx
import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface DetailRowProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
}

/**
 * A compact row component for displaying property details with optional icon.
 */
function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
      {icon && (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 1.5, minWidth: 20 }}>
          {icon}
        </Box>
      )}
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          minWidth: 120,
          fontSize: '0.75rem',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          fontSize: '0.875rem',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default DetailRow;
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --testPathPattern="DetailRow" --watchAll=false`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/property/shared/DetailRow.tsx frontend/src/components/property/shared/DetailRow.test.tsx
git commit -m "refactor: update DetailRow with compact typography and optional icon"
```

---

## Task 4: Create KPI Cards Section Component

**Files:**
- Create: `frontend/src/components/property/sections/PropertyKpiSection.tsx`
- Create: `frontend/src/components/property/sections/PropertyKpiSection.test.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/src/components/property/sections/PropertyKpiSection.test.tsx
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createMockProperty } from '@test-utils/test-data';
import { PropertyStatus } from '@asset-types';
import PropertyKpiSection from './PropertyKpiSection';

describe('PropertyKpiSection', () => {
  it('renders OWN status KPIs', () => {
    const property = createMockProperty({
      status: PropertyStatus.OWN,
      purchasePrice: 185000,
      debtShare: 15000,
      monthlyRent: 850,
      maintenanceFee: 200,
      waterCharge: 50,
      financialCharge: 100,
    });

    renderWithProviders(<PropertyKpiSection property={property} />);

    // Purchase price card
    expect(screen.getByText(/185.*000/)).toBeInTheDocument();
    // Rent card
    expect(screen.getByText(/850/)).toBeInTheDocument();
  });

  it('renders PROSPECT status KPIs with yield calculation', () => {
    const property = createMockProperty({
      status: PropertyStatus.PROSPECT,
      purchasePrice: 200000,
      monthlyRent: 1000,
    });

    renderWithProviders(<PropertyKpiSection property={property} />);

    // Expected rent
    expect(screen.getByText(/1.*000/)).toBeInTheDocument();
    // Gross yield: (1000 * 12) / 200000 = 6%
    expect(screen.getByText(/6.*%/)).toBeInTheDocument();
  });

  it('renders SOLD status KPIs with profit/loss', () => {
    const property = createMockProperty({
      status: PropertyStatus.SOLD,
      purchasePrice: 185000,
      salePrice: 210000,
    });

    renderWithProviders(<PropertyKpiSection property={property} />);

    // Sale price
    expect(screen.getByText(/210.*000/)).toBeInTheDocument();
    // Profit: 210000 - 185000 = 25000
    expect(screen.getByText(/25.*000/)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern="PropertyKpiSection" --watchAll=false`
Expected: FAIL with "Cannot find module './PropertyKpiSection'"

**Step 3: Write implementation**

```typescript
// frontend/src/components/property/sections/PropertyKpiSection.tsx
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PaymentsIcon from '@mui/icons-material/Payments';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Property, PropertyStatus } from '@asset-types';
import { formatCurrency } from '@asset-lib/format-utils';
import PropertyKpiCard from '../shared/PropertyKpiCard';

interface PropertyKpiSectionProps {
  property: Property;
  allTimeBalance?: number;
}

function PropertyKpiSection({ property, allTimeBalance }: PropertyKpiSectionProps) {
  const { t } = useTranslation('property');

  const totalMonthlyCosts =
    (property.maintenanceFee ?? 0) +
    (property.waterCharge ?? 0) +
    (property.financialCharge ?? 0);

  const netRent = (property.monthlyRent ?? 0) - totalMonthlyCosts;

  const grossYield =
    property.purchasePrice && property.monthlyRent
      ? ((property.monthlyRent * 12) / property.purchasePrice) * 100
      : null;

  const profitLoss =
    property.salePrice !== undefined &&
    property.salePrice !== null &&
    property.purchasePrice !== undefined &&
    property.purchasePrice !== null
      ? property.salePrice - property.purchasePrice
      : null;

  const renderOwnKpis = () => (
    <>
      <Grid size={{ xs: 12, sm: 4 }}>
        <PropertyKpiCard
          icon={<PaymentsIcon fontSize="small" />}
          label={t('purchasePrice')}
          value={formatCurrency(property.purchasePrice ?? 0)}
          subtitle={property.debtShare ? `+ ${formatCurrency(property.debtShare)} ${t('debtShare').toLowerCase()}` : undefined}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <PropertyKpiCard
          icon={<AttachMoneyIcon fontSize="small" />}
          label={t('monthlyRent')}
          value={`${formatCurrency(property.monthlyRent ?? 0)}${t('perMonth')}`}
          subtitle={totalMonthlyCosts > 0 ? `${t('netRent')}: ${formatCurrency(netRent)}${t('perMonth')}` : undefined}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <PropertyKpiCard
          icon={<AccountBalanceIcon fontSize="small" />}
          label={t('allTimeBalance')}
          value={formatCurrency(allTimeBalance ?? 0)}
        />
      </Grid>
    </>
  );

  const renderProspectKpis = () => (
    <>
      <Grid size={{ xs: 12, sm: 4 }}>
        <PropertyKpiCard
          icon={<PaymentsIcon fontSize="small" />}
          label={t('askingPrice')}
          value={formatCurrency(property.purchasePrice ?? 0)}
          subtitle={property.debtShare ? `+ ${formatCurrency(property.debtShare)} ${t('debtShare').toLowerCase()}` : undefined}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <PropertyKpiCard
          icon={<AttachMoneyIcon fontSize="small" />}
          label={t('expectedRent')}
          value={`${formatCurrency(property.monthlyRent ?? 0)}${t('perMonth')}`}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <PropertyKpiCard
          icon={<TrendingUpIcon fontSize="small" />}
          label={t('grossYield')}
          value={grossYield !== null ? `${grossYield.toFixed(1)}%` : '-'}
        />
      </Grid>
    </>
  );

  const renderSoldKpis = () => {
    const isProfit = profitLoss !== null && profitLoss >= 0;
    return (
      <>
        <Grid size={{ xs: 12, sm: 4 }}>
          <PropertyKpiCard
            icon={<PaymentsIcon fontSize="small" />}
            label={t('purchasePrice')}
            value={formatCurrency(property.purchasePrice ?? 0)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <PropertyKpiCard
            icon={<AttachMoneyIcon fontSize="small" />}
            label={t('salePrice')}
            value={formatCurrency(property.salePrice ?? 0)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <PropertyKpiCard
            icon={isProfit ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
            label={t('profitLoss')}
            value={profitLoss !== null ? `${isProfit ? '+' : ''}${formatCurrency(profitLoss)}` : '-'}
            valueColor={profitLoss !== null ? (isProfit ? 'success.main' : 'error.main') : 'text.primary'}
          />
        </Grid>
      </>
    );
  };

  return (
    <Grid container spacing={2}>
      {property.status === PropertyStatus.OWN && renderOwnKpis()}
      {property.status === PropertyStatus.PROSPECT && renderProspectKpis()}
      {property.status === PropertyStatus.SOLD && renderSoldKpis()}
    </Grid>
  );
}

export default PropertyKpiSection;
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --testPathPattern="PropertyKpiSection" --watchAll=false`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/property/sections/PropertyKpiSection.tsx frontend/src/components/property/sections/PropertyKpiSection.test.tsx
git commit -m "feat: add PropertyKpiSection with status-specific KPI cards"
```

---

## Task 5: Create Info Cards Section Component

**Files:**
- Create: `frontend/src/components/property/sections/PropertyInfoSection.tsx`
- Create: `frontend/src/components/property/sections/PropertyInfoSection.test.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/src/components/property/sections/PropertyInfoSection.test.tsx
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createMockProperty } from '@test-utils/test-data';
import { PropertyStatus } from '@asset-types';
import PropertyInfoSection from './PropertyInfoSection';

describe('PropertyInfoSection', () => {
  it('renders property info card with size and build year', () => {
    const property = createMockProperty({
      size: 45,
      buildYear: 2018,
      purchasePrice: 180000,
    });

    renderWithProviders(<PropertyInfoSection property={property} />);

    expect(screen.getByText('45 m²')).toBeInTheDocument();
    expect(screen.getByText('2018')).toBeInTheDocument();
  });

  it('renders location card when address exists', () => {
    const property = createMockProperty({
      address: {
        street: 'Test Street 1',
        city: 'Helsinki',
        postalCode: '00100',
      },
    });

    renderWithProviders(<PropertyInfoSection property={property} />);

    expect(screen.getByText('Test Street 1')).toBeInTheDocument();
    expect(screen.getByText(/Helsinki/)).toBeInTheDocument();
  });

  it('renders monthly costs card when costs exist', () => {
    const property = createMockProperty({
      maintenanceFee: 200,
      waterCharge: 30,
    });

    renderWithProviders(<PropertyInfoSection property={property} />);

    expect(screen.getByText(/200/)).toBeInTheDocument();
    expect(screen.getByText(/30/)).toBeInTheDocument();
  });

  it('renders purchase details for OWN status', () => {
    const property = createMockProperty({
      status: PropertyStatus.OWN,
      purchaseDate: '2020-05-15',
      purchaseLoan: 150000,
    });

    renderWithProviders(<PropertyInfoSection property={property} />);

    expect(screen.getByText(/150.*000/)).toBeInTheDocument();
  });

  it('does not render location card when no address', () => {
    const property = createMockProperty({
      address: undefined,
    });

    renderWithProviders(<PropertyInfoSection property={property} />);

    // Location section title should not be present
    expect(screen.queryByText(/location/i)).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern="PropertyInfoSection" --watchAll=false`
Expected: FAIL with "Cannot find module './PropertyInfoSection'"

**Step 3: Write implementation**

```typescript
// frontend/src/components/property/sections/PropertyInfoSection.tsx
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CalculateIcon from '@mui/icons-material/Calculate';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { Property, PropertyStatus } from '@asset-types';
import { formatCurrency, formatDate } from '@asset-lib/format-utils';
import PropertyInfoCard from '../shared/PropertyInfoCard';
import DetailRow from '../shared/DetailRow';

interface PropertyInfoSectionProps {
  property: Property;
}

function PropertyInfoSection({ property }: PropertyInfoSectionProps) {
  const { t } = useTranslation('property');

  const hasAddress = property.address?.street || property.address?.city;
  const hasCosts =
    property.maintenanceFee !== undefined ||
    property.waterCharge !== undefined ||
    property.financialCharge !== undefined;
  const hasPurchaseDetails =
    (property.status === PropertyStatus.OWN || property.status === PropertyStatus.SOLD) &&
    (property.purchaseDate !== undefined || property.purchaseLoan !== undefined);

  const totalMonthlyCosts =
    (property.maintenanceFee ?? 0) +
    (property.waterCharge ?? 0) +
    (property.financialCharge ?? 0);

  const pricePerSqm =
    property.purchasePrice && property.size > 0
      ? Math.round(property.purchasePrice / property.size)
      : null;

  return (
    <Grid container spacing={2}>
      {/* Property Info Card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <PropertyInfoCard title={t('propertyInfo')}>
          <DetailRow
            icon={<SquareFootIcon fontSize="small" />}
            label={t('size')}
            value={`${property.size} m²`}
          />
          {property.buildYear && (
            <DetailRow
              icon={<CalendarTodayIcon fontSize="small" />}
              label={t('buildYear')}
              value={property.buildYear}
            />
          )}
          {pricePerSqm && (
            <DetailRow
              icon={<CalculateIcon fontSize="small" />}
              label={t('pricePerSqm')}
              value={formatCurrency(pricePerSqm)}
            />
          )}
        </PropertyInfoCard>
      </Grid>

      {/* Location Card */}
      {hasAddress && (
        <Grid size={{ xs: 12, md: 6 }}>
          <PropertyInfoCard title={t('locationInfo')}>
            {property.address?.street && (
              <DetailRow
                icon={<LocationOnIcon fontSize="small" />}
                label={t('address')}
                value={property.address.street}
              />
            )}
            {property.address?.city && (
              <DetailRow
                icon={<LocationCityIcon fontSize="small" />}
                label={t('city')}
                value={`${property.address.postalCode ? property.address.postalCode + ' ' : ''}${property.address.city}`}
              />
            )}
          </PropertyInfoCard>
        </Grid>
      )}

      {/* Monthly Costs Card */}
      {hasCosts && (
        <Grid size={{ xs: 12, md: 6 }}>
          <PropertyInfoCard title={t('monthlyCostsSection')}>
            {property.maintenanceFee !== undefined && property.maintenanceFee !== null && (
              <DetailRow
                icon={<HomeWorkIcon fontSize="small" />}
                label={t('maintenanceFee')}
                value={`${formatCurrency(property.maintenanceFee)}${t('perMonth')}`}
              />
            )}
            {property.waterCharge !== undefined && property.waterCharge !== null && (
              <DetailRow
                icon={<WaterDropIcon fontSize="small" />}
                label={t('waterCharge')}
                value={`${formatCurrency(property.waterCharge)}${t('perMonth')}`}
              />
            )}
            {property.financialCharge !== undefined && property.financialCharge !== null && (
              <DetailRow
                icon={<AccountBalanceIcon fontSize="small" />}
                label={t('financialCharge')}
                value={`${formatCurrency(property.financialCharge)}${t('perMonth')}`}
              />
            )}
            {totalMonthlyCosts > 0 && (
              <DetailRow
                icon={<CalculateIcon fontSize="small" />}
                label={t('totalMonthlyCosts')}
                value={`${formatCurrency(totalMonthlyCosts)}${t('perMonth')}`}
              />
            )}
          </PropertyInfoCard>
        </Grid>
      )}

      {/* Purchase Details Card */}
      {hasPurchaseDetails && (
        <Grid size={{ xs: 12, md: 6 }}>
          <PropertyInfoCard title={t('purchaseInfoSection')}>
            {property.purchaseDate !== undefined && property.purchaseDate !== null && (
              <DetailRow
                icon={<CalendarTodayIcon fontSize="small" />}
                label={t('purchaseDate')}
                value={formatDate(property.purchaseDate)}
              />
            )}
            {property.purchaseLoan !== undefined && property.purchaseLoan !== null && (
              <DetailRow
                icon={<AccountBalanceIcon fontSize="small" />}
                label={t('purchaseLoan')}
                value={formatCurrency(property.purchaseLoan)}
              />
            )}
          </PropertyInfoCard>
        </Grid>
      )}
    </Grid>
  );
}

export default PropertyInfoSection;
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --testPathPattern="PropertyInfoSection" --watchAll=false`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/property/sections/PropertyInfoSection.tsx frontend/src/components/property/sections/PropertyInfoSection.test.tsx
git commit -m "feat: add PropertyInfoSection with info cards grid"
```

---

## Task 6: Add Translation Keys

**Files:**
- Modify: `frontend/src/translations/en.ts`
- Modify: `frontend/src/translations/fi.ts`
- Modify: `frontend/src/translations/sv.ts`

**Step 1: Add English translations**

Add to `property` namespace in `frontend/src/translations/en.ts`:

```typescript
// Add these keys to the property section:
netRent: 'Net',
allTimeBalance: 'All-time Balance',
grossYield: 'Gross Yield',
```

**Step 2: Add Finnish translations**

Add to `property` namespace in `frontend/src/translations/fi.ts`:

```typescript
// Add these keys to the property section:
netRent: 'Netto',
allTimeBalance: 'Kokonaissaldo',
grossYield: 'Bruttovuokratuotto',
```

**Step 3: Add Swedish translations**

Add to `property` namespace in `frontend/src/translations/sv.ts`:

```typescript
// Add these keys to the property section:
netRent: 'Netto',
allTimeBalance: 'Total balans',
grossYield: 'Bruttoavkastning',
```

**Step 4: Run translation tests**

Run: `cd frontend && npm test -- --testPathPattern="translation" --watchAll=false`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/translations/en.ts frontend/src/translations/fi.ts frontend/src/translations/sv.ts
git commit -m "feat: add translation keys for KPI cards"
```

---

## Task 7: Refactor PropertyView to Use New Components

**Files:**
- Modify: `frontend/src/components/property/PropertyView.tsx`

**Step 1: Run existing tests to establish baseline**

Run: `cd frontend && npm test -- --testPathPattern="PropertyView" --watchAll=false`
Expected: All current tests PASS

**Step 2: Refactor PropertyView**

Replace the PropertyView component with the new card-based layout:

```typescript
// frontend/src/components/property/PropertyView.tsx
import { Box, Grid, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WithTranslation, withTranslation } from 'react-i18next';
import { propertyContext } from '../../lib/asset-contexts';
import { Property, PropertyStatus, propertyTypeNames, PropertyStatistics } from '@asset-types';
import ApiClient from '../../lib/api-client';
import AssetLoadingProgress from '../asset/AssetLoadingProgress';
import AssetButton from '../asset/form/AssetButton';
import { getPhotoUrl } from '@asset-lib/functions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PropertyReportSection from './report/PropertyReportSection';
import { AllocationRulesModal } from '../allocation';
import { getReturnPathForStatus } from './property-form-utils';
import PropertyStatusRibbon from './PropertyStatusRibbon';
import ProspectInvestmentSection from './sections/ProspectInvestmentSection';
import PropertyActionsMenu from './sections/PropertyActionsMenu';
import SoldSummarySection from './sections/SoldSummarySection';
import PropertyKpiSection from './sections/PropertyKpiSection';
import PropertyInfoSection from './sections/PropertyInfoSection';
import PropertyInfoCard from './shared/PropertyInfoCard';
import { VITE_API_URL } from '../../constants';
import axios from 'axios';
import { calculateSummaryData } from './report/report-utils';

function PropertyView({ t }: WithTranslation) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [showAdvancedReports, setShowAdvancedReports] = useState(false);
  const [statistics, setStatistics] = useState<PropertyStatistics[]>([]);
  const { idParam } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperty = async () => {
      if (!idParam) {
        setError('Property ID not provided');
        setLoading(false);
        return;
      }

      try {
        const data = await ApiClient.get<Property>(
          propertyContext.apiPath,
          Number(idParam),
          { ownerships: true }
        );
        setProperty(data);

        // Fetch statistics for OWN/SOLD properties
        if (data.status === PropertyStatus.OWN || data.status === PropertyStatus.SOLD) {
          const url = `${VITE_API_URL}/real-estate/property/${idParam}/statistics/search`;
          const options = await ApiClient.getOptions();
          const statsResponse = await axios.post<PropertyStatistics[]>(
            url,
            { includeYearly: true },
            options
          );
          setStatistics(statsResponse.data);
        }
      } catch (err) {
        setError('Failed to load property');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [idParam]);

  const summaryData = useMemo(
    () => calculateSummaryData(statistics, new Date().getFullYear()),
    [statistics]
  );

  const getRoutePrefix = () => {
    return property?.status === PropertyStatus.PROSPECT ? 'prospects' : 'own';
  };

  const handleEdit = () => {
    const prefix = getRoutePrefix();
    navigate(`${propertyContext.routePath}/${prefix}/edit/${idParam}`, {
      state: { returnTo: 'view' },
    });
  };

  const handleBack = () => {
    const status = property?.status ?? PropertyStatus.OWN;
    navigate(getReturnPathForStatus(status));
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <AssetLoadingProgress />
      </Paper>
    );
  }

  if (error || !property) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="error">{error || 'Property not found'}</Typography>
      </Paper>
    );
  }

  const imageUrl = getPhotoUrl(property.photo);
  const ownershipShare = property.ownerships?.[0]?.share ?? 100;

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      {/* Hero image with status ribbon - reduced height */}
      <Box sx={{ position: 'relative' }}>
        <Box
          component="img"
          src={imageUrl}
          alt={property.name}
          sx={{
            width: '100%',
            height: { xs: 150, sm: 180 },
            objectFit: 'cover',
          }}
        />
        <PropertyStatusRibbon status={property.status} ownershipShare={ownershipShare} />
      </Box>

      {/* Header: Back + Name + Menu */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <AssetButton
              label={t('back')}
              variant="text"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ ml: -1, mb: 0.5 }}
            />
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
              {property.name}
            </Typography>
            {(property.apartmentType || property.rooms) && (
              <Typography variant="body2" color="text.secondary">
                {[
                  property.apartmentType ? t(`propertyTypes.${propertyTypeNames.get(property.apartmentType)}`) : null,
                  property.rooms,
                ].filter(Boolean).join(' · ')}
              </Typography>
            )}
          </Box>
          <PropertyActionsMenu
            property={property}
            onEdit={handleEdit}
            onOpenAllocationRules={() => setRulesModalOpen(true)}
            onToggleAdvancedReports={() => setShowAdvancedReports((prev) => !prev)}
          />
        </Stack>
      </Box>

      {/* KPI Cards Section */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <PropertyKpiSection property={property} allTimeBalance={summaryData.allTimeBalance} />
      </Box>

      {/* Info Cards Grid */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <PropertyInfoSection property={property} />
      </Box>

      {/* Description Card */}
      {property.description && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Grid container>
            <Grid size={{ xs: 12 }}>
              <PropertyInfoCard title={t('description')}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {property.description}
                </Typography>
              </PropertyInfoCard>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Statistics - only for OWN */}
      {property.status === PropertyStatus.OWN && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: '0.75rem',
              fontWeight: 500,
              mb: 1.5,
            }}
          >
            {t('statisticsSection')}
          </Typography>
          <PropertyReportSection propertyId={property.id} showAdvancedReports={showAdvancedReports} />
        </Box>
      )}

      {/* Investment Calculator - only for PROSPECT */}
      {property.status === PropertyStatus.PROSPECT && (
        <ProspectInvestmentSection property={property} />
      )}

      {/* Statistics - for SOLD */}
      {property.status === PropertyStatus.SOLD && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: '0.75rem',
              fontWeight: 500,
              mb: 1.5,
            }}
          >
            {t('statisticsSection')}
          </Typography>
          <PropertyReportSection propertyId={property.id} showAdvancedReports={showAdvancedReports} />
        </Box>
      )}

      {/* Allocation Rules Modal */}
      <AllocationRulesModal
        open={rulesModalOpen}
        propertyId={property.id}
        propertyName={property.name}
        onClose={() => setRulesModalOpen(false)}
      />
    </Paper>
  );
}

export default withTranslation(propertyContext.name)(PropertyView);
```

**Step 3: Run tests to verify refactor works**

Run: `cd frontend && npm test -- --testPathPattern="PropertyView" --watchAll=false`
Expected: PASS (may need test updates for new structure)

**Step 4: Update PropertyView tests if needed**

Update tests that rely on old structure (Dividers, specific section ordering).

**Step 5: Commit**

```bash
git add frontend/src/components/property/PropertyView.tsx frontend/src/components/property/PropertyView.test.tsx
git commit -m "refactor: PropertyView with card-based layout and KPI sections"
```

---

## Task 8: Visual QA and Final Adjustments

**Step 1: Start dev server**

Run: `cd frontend && npm run dev`

**Step 2: Visual inspection checklist**

- [ ] Desktop: KPI cards display in 3 columns
- [ ] Desktop: Info cards display in 2 columns
- [ ] Mobile: All cards stack vertically
- [ ] Typography is compact (12px labels, 14px values, 20px KPIs)
- [ ] OWN properties show correct KPIs (price, rent, balance)
- [ ] PROSPECT properties show correct KPIs (asking, expected rent, yield)
- [ ] SOLD properties show correct KPIs (purchase, sale, profit/loss)
- [ ] Profit shows green, loss shows red
- [ ] Cards have consistent borders and spacing

**Step 3: Fix any visual issues found**

Adjust spacing, typography, or colors as needed.

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: visual adjustments for PropertyView redesign"
```

---

## Summary

| Task | Description | New Files | Modified Files |
|------|-------------|-----------|----------------|
| 1 | PropertyKpiCard | 2 | 0 |
| 2 | PropertyInfoCard | 2 | 0 |
| 3 | DetailRow update | 1 | 1 |
| 4 | PropertyKpiSection | 2 | 0 |
| 5 | PropertyInfoSection | 2 | 0 |
| 6 | Translations | 0 | 3 |
| 7 | PropertyView refactor | 0 | 2 |
| 8 | Visual QA | 0 | varies |

**Total new files:** 9
**Total modified files:** 6+
