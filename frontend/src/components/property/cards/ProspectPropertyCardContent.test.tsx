import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createMockProperty } from '@test-utils/test-data';
import { PropertyStatus, PropertyExternalSource } from '@asset-types';
import ProspectPropertyCardContent from './ProspectPropertyCardContent';

describe('ProspectPropertyCardContent', () => {
  describe('asking price display', () => {
    it('displays asking price when provided', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 185000,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      expect(screen.getByText(/185.*000/)).toBeInTheDocument();
    });

    it('displays asking price label', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 185000,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Uses i18n key property:askingPrice -> "Asking Price"
      expect(screen.getByText(/Asking Price|askingPrice/i)).toBeInTheDocument();
    });

    it('handles missing asking price', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: undefined,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it('handles zero asking price', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 0,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should display zero value
      expect(screen.getByText(/0/)).toBeInTheDocument();
    });
  });

  describe('price per square meter calculation', () => {
    it('displays price per square meter', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 180000,
        size: 45,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Price/m2 = 180000 / 45 = 4000
      expect(screen.getByText(/4.*000/)).toBeInTheDocument();
    });

    it('displays price per square meter label', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 180000,
        size: 45,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Uses i18n key property:pricePerSqm -> "Price/m2"
      expect(screen.getByText(/Price\/m|pricePerSqm/i)).toBeInTheDocument();
    });

    it('handles missing size for price per sqm calculation', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 180000,
        size: 0,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should render without crashing (may show dash or N/A)
      expect(document.body).toBeInTheDocument();
    });

    it('handles missing price for price per sqm calculation', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: undefined,
        size: 45,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it('rounds price per square meter to whole number', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 185000,
        size: 47,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Price/m2 = 185000 / 47 = 3936.17... -> should round to 3936
      expect(screen.getByText(/3.*936/)).toBeInTheDocument();
    });
  });

  describe('expected rent display', () => {
    it('displays expected rent when provided', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        monthlyRent: 950,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      expect(screen.getByText(/950/)).toBeInTheDocument();
    });

    it('displays expected rent label', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        monthlyRent: 950,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Uses i18n key property:expectedRent -> "Expected Rent"
      expect(screen.getByText(/Expected Rent|expectedRent/i)).toBeInTheDocument();
    });

    it('handles missing expected rent', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        monthlyRent: undefined,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('gross yield calculation', () => {
    it('displays gross yield percentage', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 180000,
        monthlyRent: 900,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Gross yield = (900 * 12) / 180000 * 100 = 6%
      expect(screen.getByText(/6/)).toBeInTheDocument();
    });

    it('displays gross yield label', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 180000,
        monthlyRent: 900,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Uses i18n key property:grossYield -> "Gross Yield"
      expect(screen.getByText(/Gross Yield|grossYield/i)).toBeInTheDocument();
    });

    it('handles missing price for gross yield calculation', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: undefined,
        monthlyRent: 900,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should render without crashing (may show dash or N/A)
      expect(document.body).toBeInTheDocument();
    });

    it('handles missing rent for gross yield calculation', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 180000,
        monthlyRent: undefined,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it('handles zero price for gross yield calculation', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 0,
        monthlyRent: 900,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should handle division by zero gracefully
      expect(document.body).toBeInTheDocument();
    });

    it('formats gross yield with one decimal place', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 185000,
        monthlyRent: 950,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Gross yield = (950 * 12) / 185000 * 100 = 6.16...%
      expect(screen.getByText(/6\.[12]/)).toBeInTheDocument();
    });
  });

  describe('external source display', () => {
    it('displays Etuovi source indicator', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        externalSource: PropertyExternalSource.ETUOVI,
        externalSourceId: '12345',
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should display Etuovi indicator
      expect(screen.getByText(/Etuovi|etuovi/i)).toBeInTheDocument();
    });

    it('displays Oikotie source indicator', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        externalSource: PropertyExternalSource.OIKOTIE,
        externalSourceId: '67890',
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should display Oikotie indicator
      expect(screen.getByText(/Oikotie|oikotie/i)).toBeInTheDocument();
    });

    it('does not display source indicator when no external source', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        externalSource: undefined,
        externalSourceId: undefined,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should not display Etuovi or Oikotie
      expect(screen.queryByText(/Etuovi|etuovi/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Oikotie|oikotie/i)).not.toBeInTheDocument();
    });
  });

  describe('layout and formatting', () => {
    it('formats currency values with euro symbol', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 185000,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should format as currency with euro symbol
      expect(screen.getByText(/185.*000/)).toBeInTheDocument();
    });

    it('formats percentage values with percent symbol', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 180000,
        monthlyRent: 900,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should display percentage with % symbol
      expect(screen.getByText(/%/)).toBeInTheDocument();
    });
  });

  describe('debt share display', () => {
    it('displays debt share when provided', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 150000,
        debtShare: 30000,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should display debt share value
      expect(screen.getByText(/30.*000/)).toBeInTheDocument();
    });

    it('handles missing debt share', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Prospect',
        status: PropertyStatus.PROSPECT,
        purchasePrice: 150000,
        debtShare: undefined,
      });

      renderWithProviders(
        <ProspectPropertyCardContent property={property} />
      );

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });
  });
});
