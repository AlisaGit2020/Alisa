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
