import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createMockProperty } from '@test-utils/test-data';
import { PropertyStatus } from '@asset-types/common';
import ApiClient from '@asset-lib/api-client';
import PropertyActionsMenu from './PropertyActionsMenu';

describe('PropertyActionsMenu', () => {
  const mockOnEdit = jest.fn();
  const mockOnOpenAllocationRules = jest.fn();
  const mockOnPropertyUpdated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Prospect property - "Apartment purchased" (Mark as Purchased)', () => {
    const prospectProperty = createMockProperty({
      id: 1,
      name: 'Prospect Apartment',
      status: PropertyStatus.PROSPECT,
    });

    it('shows "Apartment purchased" menu item for prospect properties', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <PropertyActionsMenu
          property={prospectProperty}
          onEdit={mockOnEdit}
          onOpenAllocationRules={mockOnOpenAllocationRules}
          onPropertyUpdated={mockOnPropertyUpdated}
        />
      );

      // Open the menu
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);

      // Should show "Apartment purchased" menu item
      expect(screen.getByText('Apartment purchased')).toBeInTheDocument();
    });

    it('opens purchase dialog when "Apartment purchased" is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <PropertyActionsMenu
          property={prospectProperty}
          onEdit={mockOnEdit}
          onOpenAllocationRules={mockOnOpenAllocationRules}
          onPropertyUpdated={mockOnPropertyUpdated}
        />
      );

      // Open the menu and click "Apartment purchased"
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);
      await user.click(screen.getByText('Apartment purchased'));

      // Should open dialog with purchase fields
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Dialog should have purchase date, purchase price, and purchase loan fields
      expect(screen.getAllByLabelText(/purchase date/i).length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText(/purchase price/i).length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText(/purchase loan/i).length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText(/ownership share/i).length).toBeGreaterThan(0);
    });

    it('submits purchase data and shows congratulations', async () => {
      const user = userEvent.setup();
      const mockPut = jest.spyOn(ApiClient, 'put').mockResolvedValue({
        ...prospectProperty,
        status: PropertyStatus.OWN,
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 250000,
        purchaseLoan: 200000,
      });

      renderWithProviders(
        <PropertyActionsMenu
          property={prospectProperty}
          onEdit={mockOnEdit}
          onOpenAllocationRules={mockOnOpenAllocationRules}
          onPropertyUpdated={mockOnPropertyUpdated}
        />
      );

      // Open dialog
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);
      await user.click(screen.getByText('Apartment purchased'));

      // Fill in the form
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill purchase price
      const priceInput = screen.getByLabelText(/purchase price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '250000');

      // Submit the form
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Should call API
      await waitFor(() => {
        expect(mockPut).toHaveBeenCalled();
      });

      // Should show congratulations message
      await waitFor(() => {
        expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
      });

      // Should call onPropertyUpdated callback
      expect(mockOnPropertyUpdated).toHaveBeenCalled();

      mockPut.mockRestore();
    });

    it('does not show "Apartment purchased" for non-prospect properties', async () => {
      const user = userEvent.setup();
      const ownProperty = createMockProperty({
        id: 1,
        name: 'Own Apartment',
        status: PropertyStatus.OWN,
      });

      renderWithProviders(
        <PropertyActionsMenu
          property={ownProperty}
          onEdit={mockOnEdit}
          onOpenAllocationRules={mockOnOpenAllocationRules}
          onPropertyUpdated={mockOnPropertyUpdated}
        />
      );

      // Open the menu
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);

      // Should NOT show "Apartment purchased" menu item
      expect(screen.queryByText('Apartment purchased')).not.toBeInTheDocument();
    });
  });

  describe('Own property - "Apartment sold" (Mark as Sold)', () => {
    const ownProperty = createMockProperty({
      id: 1,
      name: 'Own Apartment',
      status: PropertyStatus.OWN,
      purchasePrice: 200000,
      purchaseDate: new Date('2020-01-01'),
    });

    it('shows "Apartment sold" menu item for own properties', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <PropertyActionsMenu
          property={ownProperty}
          onEdit={mockOnEdit}
          onOpenAllocationRules={mockOnOpenAllocationRules}
          onPropertyUpdated={mockOnPropertyUpdated}
        />
      );

      // Open the menu
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);

      // Should show "Apartment sold" menu item
      expect(screen.getByText('Apartment sold')).toBeInTheDocument();
    });

    it('opens sale dialog when "Apartment sold" is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <PropertyActionsMenu
          property={ownProperty}
          onEdit={mockOnEdit}
          onOpenAllocationRules={mockOnOpenAllocationRules}
          onPropertyUpdated={mockOnPropertyUpdated}
        />
      );

      // Open the menu and click "Apartment sold"
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);
      await user.click(screen.getByText('Apartment sold'));

      // Should open dialog with sale fields
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Dialog should have sale date and sale price fields
      expect(screen.getAllByLabelText(/sale date/i).length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText(/sale price/i).length).toBeGreaterThan(0);
    });

    it('submits sale data and shows congratulations', async () => {
      const user = userEvent.setup();
      const mockPut = jest.spyOn(ApiClient, 'put').mockResolvedValue({
        ...ownProperty,
        status: PropertyStatus.SOLD,
        saleDate: new Date('2024-06-15'),
        salePrice: 300000,
      });

      renderWithProviders(
        <PropertyActionsMenu
          property={ownProperty}
          onEdit={mockOnEdit}
          onOpenAllocationRules={mockOnOpenAllocationRules}
          onPropertyUpdated={mockOnPropertyUpdated}
        />
      );

      // Open dialog
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);
      await user.click(screen.getByText('Apartment sold'));

      // Fill in the form
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill sale price
      const priceInput = screen.getByLabelText(/sale price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '300000');

      // Submit the form
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Should call API
      await waitFor(() => {
        expect(mockPut).toHaveBeenCalled();
      });

      // Should show congratulations message
      await waitFor(() => {
        expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
      });

      // Should call onPropertyUpdated callback
      expect(mockOnPropertyUpdated).toHaveBeenCalled();

      mockPut.mockRestore();
    });

    it('does not show "Apartment sold" for non-own properties', async () => {
      const user = userEvent.setup();
      const prospectProperty = createMockProperty({
        id: 1,
        name: 'Prospect Apartment',
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(
        <PropertyActionsMenu
          property={prospectProperty}
          onEdit={mockOnEdit}
          onOpenAllocationRules={mockOnOpenAllocationRules}
          onPropertyUpdated={mockOnPropertyUpdated}
        />
      );

      // Open the menu
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);

      // Should NOT show "Apartment sold" menu item
      expect(screen.queryByText('Apartment sold')).not.toBeInTheDocument();
    });

    it('does not show "Apartment sold" for sold properties', async () => {
      const user = userEvent.setup();
      const soldProperty = createMockProperty({
        id: 1,
        name: 'Sold Apartment',
        status: PropertyStatus.SOLD,
      });

      renderWithProviders(
        <PropertyActionsMenu
          property={soldProperty}
          onEdit={mockOnEdit}
          onOpenAllocationRules={mockOnOpenAllocationRules}
          onPropertyUpdated={mockOnPropertyUpdated}
        />
      );

      // Open the menu
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);

      // Should NOT show "Apartment sold" menu item
      expect(screen.queryByText('Apartment sold')).not.toBeInTheDocument();
    });
  });

  describe('Dialog cancellation', () => {
    it('closes purchase dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      const prospectProperty = createMockProperty({
        id: 1,
        name: 'Prospect Apartment',
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(
        <PropertyActionsMenu
          property={prospectProperty}
          onEdit={mockOnEdit}
          onOpenAllocationRules={mockOnOpenAllocationRules}
          onPropertyUpdated={mockOnPropertyUpdated}
        />
      );

      // Open dialog
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);
      await user.click(screen.getByText('Apartment purchased'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes sale dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      const ownProperty = createMockProperty({
        id: 1,
        name: 'Own Apartment',
        status: PropertyStatus.OWN,
      });

      renderWithProviders(
        <PropertyActionsMenu
          property={ownProperty}
          onEdit={mockOnEdit}
          onOpenAllocationRules={mockOnOpenAllocationRules}
          onPropertyUpdated={mockOnPropertyUpdated}
        />
      );

      // Open dialog
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);
      await user.click(screen.getByText('Apartment sold'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
});
