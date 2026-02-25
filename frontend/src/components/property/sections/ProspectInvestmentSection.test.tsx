import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import ProspectInvestmentSection from './ProspectInvestmentSection';
import { Property, PropertyStatus } from '@asset-types';

const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: 1,
  name: 'Test Property',
  size: 55,
  status: PropertyStatus.PROSPECT,
  ...overrides,
});

describe('ProspectInvestmentSection', () => {
  it('renders section header', () => {
    const property = createMockProperty();

    renderWithProviders(
      <ProspectInvestmentSection property={property} />
    );

    // Should render the investmentAnalysis translation key
    expect(screen.getByText(/investment/i)).toBeInTheDocument();
  });

  it('renders upcoming feature placeholder', () => {
    const property = createMockProperty();

    renderWithProviders(
      <ProspectInvestmentSection property={property} />
    );

    // Should show upcoming feature message
    expect(screen.getByText(/upcoming/i)).toBeInTheDocument();
  });

  it('does not render investment calculator form', () => {
    const property = createMockProperty();

    renderWithProviders(
      <ProspectInvestmentSection property={property} />
    );

    // Should NOT have form inputs (no spinbuttons for number fields)
    const spinbuttons = screen.queryAllByRole('spinbutton');
    expect(spinbuttons.length).toBe(0);
  });
});
