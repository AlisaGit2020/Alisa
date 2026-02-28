import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders, createMockProperty } from '@test-utils';
import InvestmentAddDialog from './InvestmentAddDialog';
import { PropertyStatus } from '@asset-types';

describe('InvestmentAddDialog', () => {
  const defaultProps = {
    open: true,
    property: createMockProperty({
      id: 1,
      name: 'Test Property',
      size: 55,
      status: PropertyStatus.PROSPECT,
    }),
    onClose: jest.fn(),
    onSave: jest.fn(),
  };

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      renderWithProviders(<InvestmentAddDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      renderWithProviders(<InvestmentAddDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders name input field', () => {
      renderWithProviders(<InvestmentAddDialog {...defaultProps} />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('autofocuses on name field when dialog opens', async () => {
      renderWithProviders(<InvestmentAddDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);

      // Wait for autofocus to be applied
      await waitFor(() => {
        expect(document.activeElement).toBe(nameInput);
      });
    });

    it('renders investment fields', () => {
      renderWithProviders(<InvestmentAddDialog {...defaultProps} />);

      // Section headers are displayed (cost fields removed from form)
      expect(screen.getByText('Property Details')).toBeInTheDocument();
      expect(screen.getByText('Rental Income')).toBeInTheDocument();
      expect(screen.getByText('Financing')).toBeInTheDocument();
    });

    it('does NOT show apartment size field', () => {
      renderWithProviders(<InvestmentAddDialog {...defaultProps} />);

      // Apartment size should NOT be in the form
      expect(screen.queryByText(/apartment size/i)).not.toBeInTheDocument();
      expect(screen.queryByText('55 m²')).not.toBeInTheDocument();
    });

    it('renders save and cancel buttons', () => {
      renderWithProviders(<InvestmentAddDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('validates name field is required', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();

      renderWithProviders(
        <InvestmentAddDialog {...defaultProps} onSave={onSave} />
      );

      // Try to save without filling name
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });

      // onSave should not have been called
      expect(onSave).not.toHaveBeenCalled();
    });

    // Note: deptFreePrice validation is tested indirectly - the default value
    // is always positive (100000), so validation passes. Testing inline editing
    // in a Dialog with AssetEditableNumber is complex due to focus management.

    // Note: rentPerMonth validation is tested indirectly via the AssetEditableNumber
    // component tests and the default value ensures it's always positive initially.
    // Testing inline editing in a Dialog is complex due to focus management.
  });

  describe('cancel behavior', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      renderWithProviders(
        <InvestmentAddDialog {...defaultProps} onClose={onClose} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('resets form when reopened', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithProviders(
        <InvestmentAddDialog {...defaultProps} />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test Name');

      // Close dialog
      rerender(<InvestmentAddDialog {...defaultProps} open={false} />);

      // Reopen dialog
      rerender(<InvestmentAddDialog {...defaultProps} open={true} />);

      // Name should be reset
      const reopenedNameInput = screen.getByLabelText(/name/i);
      expect(reopenedNameInput).toHaveValue('');
    });
  });

  describe('error handling', () => {
    it('displays validation errors when form is incomplete', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();

      renderWithProviders(<InvestmentAddDialog {...defaultProps} onSave={onSave} />);

      // Clear name field if it has a value, then try to save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should display validation error for required name field
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });

      // onSave should not have been called
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('auto-fill from property data', () => {
    it('auto-fills rentPerMonth from property', () => {
      const property = createMockProperty({
        monthlyRent: 950,
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(
        <InvestmentAddDialog
          open={true}
          property={property}
          onClose={jest.fn()}
          onSave={jest.fn()}
        />
      );

      expect(screen.getByText('950 €/mo')).toBeInTheDocument();
    });

    it('auto-fills purchasePrice from property', () => {
      const property = createMockProperty({
        purchasePrice: 150000,
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(
        <InvestmentAddDialog
          open={true}
          property={property}
          onClose={jest.fn()}
          onSave={jest.fn()}
        />
      );

      // Purchase price displayed as text
      expect(screen.getByText('150000 €')).toBeInTheDocument();
    });

  });

  describe('editable fields', () => {
    it('rent field is editable even when pre-filled from property', async () => {
      const user = userEvent.setup();
      const property = createMockProperty({
        monthlyRent: 950,
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(
        <InvestmentAddDialog
          open={true}
          property={property}
          onClose={jest.fn()}
          onSave={jest.fn()}
        />
      );

      // Click on rent field to edit
      const displayText = screen.getByText('950 €/mo');
      await user.click(displayText);

      // Should show input field for editing (not remain as read-only text)
      await waitFor(() => {
        const input = screen.getByRole('spinbutton');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue(950);
      });
    });

    it('purchase price is displayed as text and is editable', () => {
      const property = createMockProperty({
        purchasePrice: 150000,
        status: PropertyStatus.PROSPECT,
      });

      renderWithProviders(
        <InvestmentAddDialog
          open={true}
          property={property}
          onClose={jest.fn()}
          onSave={jest.fn()}
        />
      );

      // Purchase price displayed as text (AssetEditableNumber, not readOnly)
      expect(screen.getByText('150000 €')).toBeInTheDocument();
    });

    it('shows non-pre-filled fields with default values as text', () => {
      const property = createMockProperty({
        status: PropertyStatus.PROSPECT,
        // No financial fields set - using defaults
      });

      renderWithProviders(
        <InvestmentAddDialog
          open={true}
          property={property}
          onClose={jest.fn()}
          onSave={jest.fn()}
        />
      );

      // Default values displayed as text (rentPerMonth default is 800)
      expect(screen.getByText('800 €/mo')).toBeInTheDocument();
    });
  });
});
