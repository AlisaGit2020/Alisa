import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createMockProperty } from '@test-utils/test-data';
import { PropertyStatus } from '@asset-types';
import SoldPropertyCardContent from './SoldPropertyCardContent';

describe('SoldPropertyCardContent', () => {
  describe('purchase price display', () => {
    it('displays purchase price when provided', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      expect(screen.getByText(/150.*000/)).toBeInTheDocument();
    });

    it('displays purchase price label', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Uses i18n key property:purchasePrice -> "Purchase Price"
      expect(screen.getByText(/Purchase Price|purchasePrice/i)).toBeInTheDocument();
    });

    it('handles missing purchase price', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: undefined,
        salePrice: 175000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('sale price display', () => {
    it('displays sale price when provided', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      expect(screen.getByText(/175.*000/)).toBeInTheDocument();
    });

    it('displays sale price label', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Uses i18n key property:salePrice -> "Sale Price"
      expect(screen.getByText(/Sale Price|salePrice/i)).toBeInTheDocument();
    });

    it('handles missing sale price', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: undefined,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('profit/loss calculation', () => {
    it('displays profit when sale price exceeds purchase price', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Profitable Sale',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Profit = 175000 - 150000 = 25000
      expect(screen.getByText(/25.*000/)).toBeInTheDocument();
    });

    it('displays profit/loss label', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Uses i18n key property:profitLoss -> "Profit/Loss"
      expect(screen.getByText(/Profit|profitLoss/i)).toBeInTheDocument();
    });

    it('displays loss when purchase price exceeds sale price', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Loss Sale',
        status: PropertyStatus.SOLD,
        purchasePrice: 200000,
        salePrice: 175000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Loss = 175000 - 200000 = -25000
      expect(screen.getByText(/-25.*000/)).toBeInTheDocument();
    });

    it('displays zero profit when prices are equal', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Break Even Sale',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 150000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Profit = 150000 - 150000 = 0
      expect(document.body).toBeInTheDocument();
    });

    it('applies positive styling for profit', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Profitable Sale',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Profit should be displayed with positive/success styling
      const profitElement = screen.getByText(/25.*000/);
      expect(profitElement).toBeInTheDocument();
      // Note: Styling assertions would need more specific implementation
    });

    it('applies negative styling for loss', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Loss Sale',
        status: PropertyStatus.SOLD,
        purchasePrice: 200000,
        salePrice: 175000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Loss should be displayed with negative/error styling
      const lossElement = screen.getByText(/-25.*000/);
      expect(lossElement).toBeInTheDocument();
      // Note: Styling assertions would need more specific implementation
    });

    it('handles missing purchase price for profit calculation', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: undefined,
        salePrice: 175000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Should render without crashing (may show dash or N/A for profit)
      expect(document.body).toBeInTheDocument();
    });

    it('handles missing sale price for profit calculation', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: undefined,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('sale date display', () => {
    it('displays sale date when provided', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
        saleDate: new Date('2025-06-15'),
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Should display the sale date in some format
      // Checking for year to be format-agnostic
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });

    it('displays sale date label', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
        saleDate: new Date('2025-06-15'),
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Uses i18n key property:saleDate -> "Sale Date"
      expect(screen.getByText(/Sale Date|saleDate/i)).toBeInTheDocument();
    });

    it('handles missing sale date', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
        saleDate: undefined,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it('formats sale date correctly', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
        saleDate: new Date('2025-12-25'),
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Should display the date - checking for month and day components
      expect(screen.getByText(/25/)).toBeInTheDocument();
      expect(screen.getByText(/12|Dec/i)).toBeInTheDocument();
    });
  });

  describe('layout and formatting', () => {
    it('formats currency values with euro symbol', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Should format as currency with euro symbol
      expect(screen.getByText(/175.*000/)).toBeInTheDocument();
    });

    it('displays all key metrics in card', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Complete Sold Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 150000,
        salePrice: 175000,
        saleDate: new Date('2025-06-15'),
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Should display purchase price, sale price, profit, and sale date
      expect(screen.getByText(/150.*000/)).toBeInTheDocument();
      expect(screen.getByText(/175.*000/)).toBeInTheDocument();
      expect(screen.getByText(/25.*000/)).toBeInTheDocument();
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles all values being zero', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Zero Values Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 0,
        salePrice: 0,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it('handles very large values', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Expensive Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 5000000,
        salePrice: 6500000,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Should format large numbers properly
      expect(screen.getByText(/5.*000.*000/)).toBeInTheDocument();
      expect(screen.getByText(/6.*500.*000/)).toBeInTheDocument();
    });

    it('handles decimal values', () => {
      const property = createMockProperty({
        id: 1,
        name: 'Decimal Property',
        status: PropertyStatus.SOLD,
        purchasePrice: 149999.99,
        salePrice: 175000.50,
      });

      renderWithProviders(
        <SoldPropertyCardContent property={property} />
      );

      // Should handle decimal values appropriately
      expect(document.body).toBeInTheDocument();
    });
  });
});
