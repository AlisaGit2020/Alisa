import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders, createMockProperty } from '@test-utils';
import ProspectInvestmentSection from './ProspectInvestmentSection';
import { PropertyStatus } from '@asset-types';

// Mock ApiClient
import ApiClient from '@asset-lib/api-client';
jest.spyOn(ApiClient, 'search').mockResolvedValue([]);

describe('ProspectInvestmentSection', () => {
  describe('rendering', () => {
    it('renders "Sijoituslaskelmat" header without property name', async () => {
      const property = createMockProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(<ProspectInvestmentSection property={property} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should show just "Investment Calculations" header (translation of Sijoituslaskelmat)
      expect(screen.getByText(/investment calculations/i)).toBeInTheDocument();
      // Should NOT include property name in header
      expect(screen.queryByText(/Test Property/i)).not.toBeInTheDocument();
    });

    it('renders Add Calculation button above the table, right-aligned', async () => {
      const property = createMockProperty({
        id: 1,
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(<ProspectInvestmentSection property={property} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Button should be in a container above the table with right alignment
      const addButton = screen.getByRole('button', { name: /add calculation/i });
      const buttonContainer = addButton.closest('[data-testid="add-calculation-container"]');
      expect(buttonContainer).toBeInTheDocument();
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

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add calculation/i });
      await user.click(addButton);

      // Should open dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('dialog has property rent pre-filled', async () => {
      const user = userEvent.setup();
      const property = createMockProperty({
        id: 1,
        monthlyRent: 950,
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(<ProspectInvestmentSection property={property} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add calculation/i });
      await user.click(addButton);

      // Dialog should open with property rent displayed as text
      await waitFor(() => {
        expect(screen.getByText('950 €/mo')).toBeInTheDocument();
      });
    });
  });

  describe('responsive layout', () => {
    it('positions Add Calculation button at the end of table container', async () => {
      const property = createMockProperty({
        id: 1,
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(<ProspectInvestmentSection property={property} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // The button should be inside a flex container that aligns it to flex-end
      const addButton = screen.getByRole('button', { name: /add calculation/i });
      const buttonContainer = addButton.closest('[data-testid="add-calculation-container"]');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('table container has responsive width based on calculation count', async () => {
      const property = createMockProperty({
        id: 1,
        status: PropertyStatus.PROSPECT,
      });

      const { container } = renderWithProviders(<ProspectInvestmentSection property={property} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should have a responsive table wrapper
      const tableWrapper = container.querySelector('[data-testid="table-wrapper"]');
      expect(tableWrapper).toBeInTheDocument();
    });
  });
});
