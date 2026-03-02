import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createMockProperty } from '@test-utils/test-data';
import { PropertyStatus, PropertyExternalSource } from '@asset-types';
import PropertyCard from './PropertyCard';

describe('PropertyCard', () => {
  describe('renders correct content based on property status', () => {
    it('renders OwnPropertyCardContent for OWN status properties', () => {
      const property = createMockProperty({
        id: 1,
        name: 'My Helsinki Apartment',
        status: PropertyStatus.OWN,
        monthlyRent: 1200,
        maintenanceFee: 250,
        financialCharge: 50,
        waterCharge: 20,
        ownerships: [{ share: 100, userId: 1, propertyId: 1 }],
      });

      renderWithProviders(
        <PropertyCard property={property} />
      );

      // Should display property name
      expect(screen.getByText('My Helsinki Apartment')).toBeInTheDocument();

      // Should display OWN-specific content: monthly rent
      expect(screen.getByText(/1.*200/)).toBeInTheDocument();
    });

    it('renders ProspectPropertyCardContent for PROSPECT status properties', () => {
      const property = createMockProperty({
        id: 2,
        name: 'Espoo Studio Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 185000,
        size: 45,
        monthlyRent: 900,
        externalSource: PropertyExternalSource.ETUOVI,
      });

      renderWithProviders(
        <PropertyCard property={property} />
      );

      // Should display property name
      expect(screen.getByText('Espoo Studio Prospect')).toBeInTheDocument();

      // Should display PROSPECT-specific content: asking price
      expect(screen.getByText(/185.*000/)).toBeInTheDocument();
    });

    it('renders SoldPropertyCardContent for SOLD status properties', () => {
      const property = createMockProperty({
        id: 3,
        name: 'Tampere Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
        saleDate: new Date('2025-06-15'),
      });

      renderWithProviders(
        <PropertyCard property={property} />
      );

      // Should display property name
      expect(screen.getByText('Tampere Sold Property')).toBeInTheDocument();

      // Should display SOLD-specific content: sale price
      expect(screen.getByText(/175.*000/)).toBeInTheDocument();
    });
  });

  describe('property information display', () => {
    it('displays property address when available', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        address: {
          id: 1,
          street: 'Mannerheimintie 10',
          city: 'Helsinki',
          postalCode: '00100',
        },
      });

      renderWithProviders(
        <PropertyCard property={property} />
      );

      expect(screen.getByText(/Mannerheimintie 10/)).toBeInTheDocument();
      expect(screen.getByText(/Helsinki/)).toBeInTheDocument();
    });

    it('displays property size when available', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        size: 65,
      });

      renderWithProviders(
        <PropertyCard property={property} />
      );

      expect(screen.getByText(/65/)).toBeInTheDocument();
      expect(screen.getByText(/m/)).toBeInTheDocument();
    });

    it('displays property rooms when available', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        rooms: '2h+k',
      });

      renderWithProviders(
        <PropertyCard property={property} />
      );

      expect(screen.getByText(/2h\+k/)).toBeInTheDocument();
    });

    it('displays build year when available', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        buildYear: 1985,
      });

      renderWithProviders(
        <PropertyCard property={property} />
      );

      expect(screen.getByText(/1985/)).toBeInTheDocument();
    });
  });

  describe('handles missing data gracefully', () => {
    it('renders without crashing when optional fields are missing', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Minimal Property',
        status: PropertyStatus.OWN,
        address: undefined,
        size: 0,
        rooms: undefined,
        buildYear: undefined,
        monthlyRent: undefined,
      });

      renderWithProviders(
        <PropertyCard property={property} />
      );

      expect(screen.getByText('Minimal Property')).toBeInTheDocument();
    });

    it('renders without crashing when address is partial', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Partial Address Property',
        status: PropertyStatus.OWN,
        address: {
          id: 1,
          street: 'Test Street',
          city: undefined,
          postalCode: undefined,
        },
      });

      renderWithProviders(
        <PropertyCard property={property} />
      );

      expect(screen.getByText('Partial Address Property')).toBeInTheDocument();
      expect(screen.getByText(/Test Street/)).toBeInTheDocument();
    });
  });
});
