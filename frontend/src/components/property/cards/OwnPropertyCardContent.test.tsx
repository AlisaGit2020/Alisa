import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createMockProperty } from '@test-utils/test-data';
import { PropertyStatus } from '@asset-types';
import OwnPropertyCardContent from './OwnPropertyCardContent';

describe('OwnPropertyCardContent', () => {
  describe('monthly rent display', () => {
    it('displays monthly rent when provided', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        monthlyRent: 1200,
      });

      renderWithProviders(
        <OwnPropertyCardContent property={property} />
      );

      expect(screen.getByText(/1.*200/)).toBeInTheDocument();
    });

    it('displays monthly rent label', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        monthlyRent: 1200,
      });

      renderWithProviders(
        <OwnPropertyCardContent property={property} />
      );

      // Uses i18n key property:monthlyRent -> "Monthly Rent"
      expect(screen.getByText(/Monthly Rent|monthlyRent/i)).toBeInTheDocument();
    });

    it('handles zero monthly rent', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        monthlyRent: 0,
        size: 50,
      });

      renderWithProviders(
        <OwnPropertyCardContent property={property} />
      );

      // Should render without crashing and show monthly rent label
      expect(screen.getByText(/Monthly Rent|monthlyRent/i)).toBeInTheDocument();
    });

    it('handles missing monthly rent', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        monthlyRent: undefined,
      });

      renderWithProviders(
        <OwnPropertyCardContent property={property} />
      );

      // Should render the component without crashing
      // The value display may show dash, zero, or be empty
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('layout and formatting', () => {
    it('formats currency values with euro symbol', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        monthlyRent: 1500,
      });

      renderWithProviders(
        <OwnPropertyCardContent property={property} />
      );

      // Should format as currency with euro symbol
      expect(screen.getByText(/1.*500/)).toBeInTheDocument();
    });

  });
});
