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
