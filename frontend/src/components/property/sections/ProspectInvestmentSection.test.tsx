import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders, createMockProperty } from '@test-utils';
import ProspectInvestmentSection from './ProspectInvestmentSection';
import { PropertyStatus } from '@asset-types';

describe('ProspectInvestmentSection', () => {
  describe('rendering', () => {
    it('renders section header with investment analysis title', () => {
      const property = createMockProperty({
        id: 1,
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(<ProspectInvestmentSection property={property} />);

      expect(screen.getByText(/investment analysis/i)).toBeInTheDocument();
    });

    it('renders Add Calculation button', () => {
      const property = createMockProperty({
        id: 1,
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(<ProspectInvestmentSection property={property} />);

      expect(screen.getByRole('button', { name: /add calculation/i })).toBeInTheDocument();
    });
  });

  describe('data fetching', () => {
    it('shows loading state initially', () => {
      const property = createMockProperty({
        id: 1,
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(<ProspectInvestmentSection property={property} />);

      // Should show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('add calculation', () => {
    it('opens add dialog when Add Calculation button is clicked', async () => {
      const user = userEvent.setup();
      const property = createMockProperty({
        id: 1,
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(<ProspectInvestmentSection property={property} />);

      // The Add Calculation button should be visible even during loading
      const addButton = screen.getByRole('button', { name: /add calculation/i });
      await user.click(addButton);

      // Should open dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('dialog has property size pre-filled', async () => {
      const user = userEvent.setup();
      const property = createMockProperty({
        id: 1,
        size: 75,
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(<ProspectInvestmentSection property={property} />);

      const addButton = screen.getByRole('button', { name: /add calculation/i });
      await user.click(addButton);

      // Dialog should open with property size displayed as text
      await waitFor(() => {
        expect(screen.getByText('75 m²')).toBeInTheDocument();
      });
    });
  });
});
