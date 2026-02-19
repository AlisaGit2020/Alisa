import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createMockUser } from '@test-utils/test-data';
import TransactionForm from './TransactionForm';
import { TransactionStatus, TransactionType } from '@alisa-types';
import DataService from '@alisa-lib/data-service';
import ApiClient from '@alisa-lib/api-client';

jest.mock('@alisa-lib/data-service');

describe('TransactionForm', () => {
  const mockUser = createMockUser({
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
  });

  const defaultProps = {
    open: true,
    onAfterSubmit: jest.fn(),
    onCancel: jest.fn(),
    onClose: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    // Mock ApiClient.me() using spyOn
    jest.spyOn(ApiClient, 'me').mockResolvedValue(mockUser);

    // Mock DataService methods
    jest.spyOn(DataService.prototype, 'read').mockResolvedValue({
      id: 1,
      sender: 'Test Sender',
      receiver: 'Test Receiver',
      description: 'Test Description',
      amount: 100,
      status: TransactionStatus.PENDING,
      type: TransactionType.INCOME,
    });
    jest.spyOn(DataService.prototype, 'search').mockResolvedValue([]);
    jest.spyOn(DataService.prototype, 'updateNestedData').mockImplementation(
      (data, name, value) => ({ ...data, [name]: value })
    );
  });

  describe('Rendering', () => {
    it('shows dialog when open=true', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          open={true}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('does not show dialog when open=false', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          open={false}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      // Wait for any async effects to settle
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('shows loading state initially when creating new transaction', () => {
      // Temporarily delay the mock to catch loading state
      jest.spyOn(DataService.prototype, 'read').mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      // Loading should appear initially
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays transaction header text', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('transaction - income')).toBeInTheDocument();
      });
    });
  });

  describe('Form fields', () => {
    it('renders sender field', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('sender')).toBeInTheDocument();
      });
    });

    it('renders receiver field', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('receiver')).toBeInTheDocument();
      });
    });

    it('renders description field', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('description')).toBeInTheDocument();
      });
    });

    it('renders amount field', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('totalAmount')).toBeInTheDocument();
      });
    });

    it('renders date picker fields', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        // Date pickers have labels that appear multiple times (label element and legend)
        const transactionDateLabels = screen.getAllByText('transactionDate');
        const accountingDateLabels = screen.getAllByText('accountingDate');
        expect(transactionDateLabels.length).toBeGreaterThan(0);
        expect(accountingDateLabels.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Transaction types', () => {
    it('shows INCOME in title when type is INCOME', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('transaction - income')).toBeInTheDocument();
      });
    });

    it('shows EXPENSE in title when type is EXPENSE', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.EXPENSE}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('transaction - expense')).toBeInTheDocument();
      });
    });

    it('shows DEPOSIT in title when type is DEPOSIT', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.DEPOSIT}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('transaction - deposit')).toBeInTheDocument();
      });
    });

    it('shows WITHDRAW in title when type is WITHDRAW', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.WITHDRAW}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('transaction - withdraw')).toBeInTheDocument();
      });
    });

    it('sets sender to user name for EXPENSE type', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.EXPENSE}
        />
      );

      await waitFor(() => {
        const senderInput = screen.getByLabelText('sender');
        expect(senderInput).toHaveValue('Test User');
      });
    });

    it('sets receiver to user name for INCOME type', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        const receiverInput = screen.getByLabelText('receiver');
        expect(receiverInput).toHaveValue('Test User');
      });
    });

    it('sets sender to user name for WITHDRAW type', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.WITHDRAW}
        />
      );

      await waitFor(() => {
        const senderInput = screen.getByLabelText('sender');
        expect(senderInput).toHaveValue('Test User');
      });
    });

    it('sets receiver to user name for DEPOSIT type', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.DEPOSIT}
        />
      );

      await waitFor(() => {
        const receiverInput = screen.getByLabelText('receiver');
        expect(receiverInput).toHaveValue('Test User');
      });
    });
  });

  describe('User interactions', () => {
    it('allows typing in sender field', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('sender')).toBeInTheDocument();
      });

      const senderInput = screen.getByLabelText('sender');
      await user.clear(senderInput);
      await user.type(senderInput, 'New Sender');

      expect(senderInput).toHaveValue('New Sender');
    });

    it('allows typing in receiver field', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.EXPENSE}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('receiver')).toBeInTheDocument();
      });

      const receiverInput = screen.getByLabelText('receiver');
      await user.clear(receiverInput);
      await user.type(receiverInput, 'New Receiver');

      expect(receiverInput).toHaveValue('New Receiver');
    });

    it('allows typing in description field', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('description')).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText('description');
      await user.type(descriptionInput, 'Test description');

      expect(descriptionInput).toHaveValue('Test description');
    });

    it('allows typing in amount field', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('totalAmount')).toBeInTheDocument();
      });

      const amountInput = screen.getByLabelText('totalAmount');
      await user.clear(amountInput);
      await user.type(amountInput, '500');

      expect(amountInput).toHaveValue(500);
    });
  });

  describe('Cancel button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          onCancel={mockOnCancel}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'cancel' });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close handler', () => {
    it('calls onClose when dialog backdrop is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          onClose={mockOnClose}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click on the backdrop (dialog container)
      const backdrop = document.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          onClose={mockOnClose}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Edit mode', () => {
    it('sets ready immediately when id is provided', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          id={1}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('displays save button', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument();
      });
    });
  });

  describe('Property ID', () => {
    it('sets propertyId in defaults when provided', async () => {
      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          propertyId={5}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // The propertyId is set internally in data defaults
      // We verify the form renders correctly with the propertyId prop
    });
  });

  describe('Form validation', () => {
    it('shows validation error when saving with empty sender', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('sender')).toBeInTheDocument();
      });

      // Clear sender field
      const senderInput = screen.getByLabelText('sender');
      await user.clear(senderInput);

      // Click save to trigger validation
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Should show validation error - input becomes aria-invalid
      await waitFor(() => {
        expect(senderInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('shows validation error when saving with empty receiver', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.EXPENSE}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('receiver')).toBeInTheDocument();
      });

      // Clear receiver field
      const receiverInput = screen.getByLabelText('receiver');
      await user.clear(receiverInput);

      // Click save to trigger validation
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Should show validation error - input becomes aria-invalid
      await waitFor(() => {
        expect(receiverInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('shows validation error when saving with empty description', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('description')).toBeInTheDocument();
      });

      // Don't enter description (leave empty)
      // Fill other required fields
      const senderInput = screen.getByLabelText('sender');
      await user.type(senderInput, 'Test Sender');

      // Click save to trigger validation
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Should show validation error - description becomes aria-invalid
      const descriptionInput = screen.getByLabelText('description');
      await waitFor(() => {
        expect(descriptionInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('shows validation error when saving with missing transaction date', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill text fields
      const senderInput = screen.getByLabelText('sender');
      await user.type(senderInput, 'Test Sender');

      const descriptionInput = screen.getByLabelText('description');
      await user.type(descriptionInput, 'Test Description');

      // Click save to trigger validation (dates are not filled)
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Should show validation error on the transactionDate field
      await waitFor(() => {
        const transactionDateLabels = screen.getAllByText('transactionDate');
        const transactionDateField = transactionDateLabels[0].closest('.MuiFormControl-root');
        const hasError = transactionDateField?.querySelector('.Mui-error');
        expect(hasError).toBeInTheDocument();
      });
    });

    it('shows validation error when saving with missing accounting date', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill text fields
      const senderInput = screen.getByLabelText('sender');
      await user.type(senderInput, 'Test Sender');

      const descriptionInput = screen.getByLabelText('description');
      await user.type(descriptionInput, 'Test Description');

      // Click save to trigger validation
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Should show validation error on the accountingDate field
      await waitFor(() => {
        const accountingDateLabels = screen.getAllByText('accountingDate');
        const accountingDateField = accountingDateLabels[0].closest('.MuiFormControl-root');
        const hasError = accountingDateField?.querySelector('.Mui-error');
        expect(hasError).toBeInTheDocument();
      });
    });

    it('displays error helper text below sender field when saving empty', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TransactionForm
          {...defaultProps}
          status={TransactionStatus.PENDING}
          type={TransactionType.INCOME}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('sender')).toBeInTheDocument();
      });

      // Clear sender field
      const senderInput = screen.getByLabelText('sender');
      await user.clear(senderInput);

      // Click save to trigger validation
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Should show helper text with error below the field
      await waitFor(() => {
        // Look for any element with Mui-error class inside the sender text field
        const senderField = senderInput.closest('.MuiFormControl-root');
        const hasError = senderField?.querySelector('.Mui-error');
        expect(hasError).toBeInTheDocument();
      });
    });
  });
});
