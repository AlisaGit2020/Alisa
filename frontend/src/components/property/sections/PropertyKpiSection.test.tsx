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

  it('renders PROSPECT status with no debt share message when debtShare is missing', () => {
    const property = createMockProperty({
      status: PropertyStatus.PROSPECT,
      purchasePrice: 200000,
      debtShare: undefined,
      monthlyRent: 1000,
    });

    renderWithProviders(<PropertyKpiSection property={property} />);

    // Should show "No Housing Company Loan" text
    expect(screen.getByText(/No Housing Company Loan/i)).toBeInTheDocument();
  });

  it('renders PROSPECT status with separated selling price and debt share', () => {
    const property = createMockProperty({
      status: PropertyStatus.PROSPECT,
      purchasePrice: 200000, // Pyyntihinta (asking price)
      debtShare: 50000, // Yhtiölainaosuus
      monthlyRent: 1000,
    });

    renderWithProviders(<PropertyKpiSection property={property} />);

    // Myyntihinta (selling price) = 200000 - 50000 = 150000
    expect(screen.getByText(/150.*000/)).toBeInTheDocument();
    // Yhtiölainaosuus (debt share) = 50000
    expect(screen.getByText(/50.*000/)).toBeInTheDocument();
    // Pyyntihinta (asking price / total) = 200000
    expect(screen.getByText(/200.*000/)).toBeInTheDocument();
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
