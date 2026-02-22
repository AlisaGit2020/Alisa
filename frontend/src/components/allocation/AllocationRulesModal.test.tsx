// frontend/src/components/allocation/AllocationRulesModal.test.tsx
import { renderWithProviders, screen, waitFor } from '@test-utils/test-wrapper';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AllocationRulesModal from './AllocationRulesModal';

// Note: Full API integration tests for this component are covered in view tests.
// These unit tests verify the modal's basic rendering and interaction behavior.

describe('AllocationRulesModal', () => {
  const defaultProps = {
    open: true,
    propertyId: 1,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog title when open', async () => {
      renderWithProviders(<AllocationRulesModal {...defaultProps} />);

      await waitFor(() => {
        // The dialog title 'rules' is the translation key fallback
        expect(screen.getByText('rules')).toBeInTheDocument();
      });
    });

    it('renders add rule button', async () => {
      renderWithProviders(<AllocationRulesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /addRule/i })).toBeInTheDocument();
      });
    });

    it('renders close button', async () => {
      renderWithProviders(<AllocationRulesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      });
    });

    it('does not render dialog when closed', () => {
      renderWithProviders(<AllocationRulesModal {...defaultProps} open={false} />);

      // The dialog should not be visible when closed
      expect(screen.queryByText('rules')).not.toBeInTheDocument();
    });
  });

  describe('Close action', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      renderWithProviders(<AllocationRulesModal {...defaultProps} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /close/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Add rule action', () => {
    it('shows rule form when add rule button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<AllocationRulesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /addRule/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /addRule/i }));

      // After clicking add, the dialog title changes to 'addRule' and a save button appears
      await waitFor(() => {
        // The modal should now show the edit/add view with cancel and save buttons
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });
    });
  });
});
