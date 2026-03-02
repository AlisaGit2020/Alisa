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

  // District display tests (TDD - implementation does not exist yet)
  describe('district display', () => {
    it('displays district in location card when present', () => {
      const property = createMockProperty({
        address: {
          id: 1,
          street: 'Kallionkatu 5',
          city: 'Helsinki',
          postalCode: '00530',
          district: 'Kallio',
        },
      });

      renderWithProviders(<PropertyInfoSection property={property} />);

      // Should show the district value
      expect(screen.getByText('Kallio')).toBeInTheDocument();
    });

    it('displays district label when district is present', () => {
      const property = createMockProperty({
        address: {
          id: 1,
          street: 'Kallionkatu 5',
          city: 'Helsinki',
          postalCode: '00530',
          district: 'Kallio',
        },
      });

      renderWithProviders(<PropertyInfoSection property={property} />);

      // Should show the district label (from translations)
      expect(screen.getByText(/district/i)).toBeInTheDocument();
    });

    it('hides district row when district is not present', () => {
      const property = createMockProperty({
        address: {
          id: 1,
          street: 'Test Street 1',
          city: 'Helsinki',
          postalCode: '00100',
          // district is not set
        },
      });

      renderWithProviders(<PropertyInfoSection property={property} />);

      // Should not show district text (since it's not set)
      // The word "district" should not appear as a label
      expect(screen.queryByText(/district/i)).not.toBeInTheDocument();
    });

    it('renders district alongside city and street', () => {
      const property = createMockProperty({
        address: {
          id: 1,
          street: 'Töölönkatu 10',
          city: 'Helsinki',
          postalCode: '00100',
          district: 'Töölö',
        },
      });

      renderWithProviders(<PropertyInfoSection property={property} />);

      // All location details should be present
      expect(screen.getByText('Töölönkatu 10')).toBeInTheDocument();
      expect(screen.getByText(/Helsinki/)).toBeInTheDocument();
      expect(screen.getByText('Töölö')).toBeInTheDocument();
    });

    it('displays district with special characters correctly', () => {
      const property = createMockProperty({
        address: {
          id: 1,
          street: 'Sörnäistenkatu 5',
          city: 'Helsinki',
          postalCode: '00540',
          district: 'Sörnäinen',
        },
      });

      renderWithProviders(<PropertyInfoSection property={property} />);

      // Finnish special characters should render correctly
      expect(screen.getByText('Sörnäinen')).toBeInTheDocument();
    });
  });
});
