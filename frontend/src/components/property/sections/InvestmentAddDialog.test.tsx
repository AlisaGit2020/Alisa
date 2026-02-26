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

    it('renders investment input fields', () => {
      renderWithProviders(<InvestmentAddDialog {...defaultProps} />);

      expect(screen.getByLabelText(/debt-free price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/rent.*month/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maintenance fee/i)).toBeInTheDocument();
    });

    it('pre-fills apartment size from property', () => {
      renderWithProviders(<InvestmentAddDialog {...defaultProps} />);

      const sizeField = screen.getByLabelText(/apartment size/i);
      expect(sizeField).toHaveValue(55);
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

    it('validates deptFreePrice must be positive', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();

      renderWithProviders(
        <InvestmentAddDialog {...defaultProps} onSave={onSave} />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test');

      const priceInput = screen.getByLabelText(/debt-free price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '0');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show validation error - text is "Value must be greater than 0"
      await waitFor(() => {
        expect(screen.getByText(/greater than 0/i)).toBeInTheDocument();
      });
    });

    it('validates rentPerMonth must be positive', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();

      renderWithProviders(
        <InvestmentAddDialog {...defaultProps} onSave={onSave} />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test');

      const rentInput = screen.getByLabelText(/rent.*month/i);
      await user.clear(rentInput);
      await user.type(rentInput, '0');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/greater than 0/i)).toBeInTheDocument();
      });
    });
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
});
