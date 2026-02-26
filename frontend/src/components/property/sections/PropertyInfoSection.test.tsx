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
        id: 1,
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
      waterCharge: 45,
    });

    renderWithProviders(<PropertyInfoSection property={property} />);

    // Check section title is rendered (proves card is shown)
    expect(screen.getByText('Monthly Costs')).toBeInTheDocument();
    // Check that costs are rendered (using getAllByText since there are multiple € values)
    const euroValues = screen.getAllByText(/€/);
    expect(euroValues.length).toBeGreaterThanOrEqual(2);
  });

  it('renders purchase details for OWN status', () => {
    const property = createMockProperty({
      status: PropertyStatus.OWN,
      purchaseDate: new Date('2020-05-15'),
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
