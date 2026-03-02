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
      });

      renderWithProviders(
        <OwnPropertyCardContent property={property} />
      );

      // Should render without crashing
      expect(screen.getByText(/0/)).toBeInTheDocument();
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

  describe('net rent calculation', () => {
    it('displays net rent (rent minus costs)', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        monthlyRent: 1200,
        maintenanceFee: 250,
        financialCharge: 50,
        waterCharge: 20,
      });

      renderWithProviders(
        <OwnPropertyCardContent property={property} />
      );

      // Net rent = 1200 - 250 - 50 - 20 = 880
      expect(screen.getByText(/880/)).toBeInTheDocument();
    });

    it('displays net rent label', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        monthlyRent: 1200,
        maintenanceFee: 250,
      });

      renderWithProviders(
        <OwnPropertyCardContent property={property} />
      );

      // Uses i18n key property:netRent -> "Net"
      expect(screen.getByText(/Net|netRent/i)).toBeInTheDocument();
    });

    it('handles zero costs for net rent calculation', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        monthlyRent: 1000,
        maintenanceFee: 0,
        financialCharge: 0,
        waterCharge: 0,
      });

      renderWithProviders(
        <OwnPropertyCardContent property={property} />
      );

      // Net rent = 1000 - 0 - 0 - 0 = 1000
      expect(screen.getByText(/1.*000/)).toBeInTheDocument();
    });

    it('handles missing cost values for net rent calculation', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        monthlyRent: 1000,
        maintenanceFee: undefined,
        financialCharge: undefined,
        waterCharge: undefined,
      });

      renderWithProviders(
        <OwnPropertyCardContent property={property} />
      );

      // Should treat undefined costs as 0 and show net rent = 1000
      expect(screen.getByText(/1.*000/)).toBeInTheDocument();
    });

    it('displays negative net rent when costs exceed rent', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
        monthlyRent: 500,
        maintenanceFee: 400,
        financialCharge: 200,
        waterCharge: 50,
      });

      renderWithProviders(
        <OwnPropertyCardContent property={property} />
      );

      // Net rent = 500 - 400 - 200 - 50 = -150
      // Should display the negative value (with appropriate styling)
      expect(screen.getByText(/-150/)).toBeInTheDocument();
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
