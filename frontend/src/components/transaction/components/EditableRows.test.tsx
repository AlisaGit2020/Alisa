import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { TransactionType } from '@alisa-types';
import EditableRows from './EditableRows';
import ApiClient from '@alisa-lib/api-client';

// Spy on ApiClient methods
jest.spyOn(ApiClient, 'getDefault');

describe('EditableRows', () => {
  const mockDefaultRow = {
    id: 0,
    description: '',
    quantity: 1,
    amount: 0,
    totalAmount: 0,
    expenseTypeId: 1,
    incomeTypeId: 1,
    accountingDate: new Date().toISOString(),
  };

  const mockTransaction = {
    id: 1,
    amount: 1000,
    description: 'Test transaction',
    expenses: [],
    incomes: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ApiClient.getDefault as jest.SpyInstance).mockResolvedValue({ ...mockDefaultRow });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders title section', async () => {
    renderWithProviders(
      <EditableRows
        transaction={mockTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={jest.fn()}
        changedDescription=""
        changedAmount={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/rows/i)).toBeInTheDocument();
    });
  });

  it('calls onHandleChange when initialized with empty expenses', async () => {
    const mockOnHandleChange = jest.fn();

    renderWithProviders(
      <EditableRows
        transaction={mockTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription=""
        changedAmount={0}
      />
    );

    await waitFor(() => {
      expect(mockOnHandleChange).toHaveBeenCalled();
    });
  });

  it('renders add button', async () => {
    renderWithProviders(
      <EditableRows
        transaction={mockTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={jest.fn()}
        changedDescription=""
        changedAmount={0}
      />
    );

    // Wait for component to load and render button with add icon
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('can click add button', async () => {
    const user = userEvent.setup();
    const mockOnHandleChange = jest.fn();

    renderWithProviders(
      <EditableRows
        transaction={mockTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription=""
        changedAmount={0}
      />
    );

    // Wait for initial render
    await waitFor(() => {
      expect(mockOnHandleChange).toHaveBeenCalled();
    });

    const buttons = screen.getAllByRole('button');

    // Should be able to click the button without error
    await user.click(buttons[0]);

    // Test passes if no error is thrown
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders with existing expense rows', async () => {
    const transactionWithExpenses = {
      ...mockTransaction,
      expenses: [
        {
          id: 1,
          description: 'Existing expense',
          quantity: 2,
          amount: 50,
          totalAmount: 100,
          expenseTypeId: 1,
        },
      ],
    };

    renderWithProviders(
      <EditableRows
        transaction={transactionWithExpenses}
        type={TransactionType.EXPENSE}
        onHandleChange={jest.fn()}
        changedDescription=""
        changedAmount={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing expense')).toBeInTheDocument();
    });
  });

  it('renders with existing income rows', async () => {
    const transactionWithIncomes = {
      ...mockTransaction,
      incomes: [
        {
          id: 1,
          description: 'Existing income',
          quantity: 1,
          amount: 500,
          totalAmount: 500,
          incomeTypeId: 1,
        },
      ],
    };

    renderWithProviders(
      <EditableRows
        transaction={transactionWithIncomes}
        type={TransactionType.INCOME}
        onHandleChange={jest.fn()}
        changedDescription=""
        changedAmount={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing income')).toBeInTheDocument();
    });
  });

  it('calls getDefault API for expense context', async () => {
    renderWithProviders(
      <EditableRows
        transaction={mockTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={jest.fn()}
        changedDescription=""
        changedAmount={0}
      />
    );

    await waitFor(() => {
      expect(ApiClient.getDefault).toHaveBeenCalledWith('accounting/expense');
    });
  });

  it('calls getDefault API for income context', async () => {
    renderWithProviders(
      <EditableRows
        transaction={mockTransaction}
        type={TransactionType.INCOME}
        onHandleChange={jest.fn()}
        changedDescription=""
        changedAmount={0}
      />
    );

    await waitFor(() => {
      expect(ApiClient.getDefault).toHaveBeenCalledWith('accounting/income');
    });
  });

  it('updates when changedDescription prop changes', async () => {
    const mockOnHandleChange = jest.fn();

    const { rerender } = renderWithProviders(
      <EditableRows
        transaction={mockTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription=""
        changedAmount={0}
      />
    );

    await waitFor(() => {
      expect(mockOnHandleChange).toHaveBeenCalled();
    });

    mockOnHandleChange.mockClear();

    rerender(
      <EditableRows
        transaction={mockTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription="New description"
        changedAmount={0}
      />
    );

    await waitFor(() => {
      expect(mockOnHandleChange).toHaveBeenCalled();
    });
  });

  it('updates when changedAmount prop changes', async () => {
    const mockOnHandleChange = jest.fn();

    const { rerender } = renderWithProviders(
      <EditableRows
        transaction={mockTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription=""
        changedAmount={0}
      />
    );

    await waitFor(() => {
      expect(mockOnHandleChange).toHaveBeenCalled();
    });

    mockOnHandleChange.mockClear();

    rerender(
      <EditableRows
        transaction={mockTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription=""
        changedAmount={500}
      />
    );

    await waitFor(() => {
      expect(mockOnHandleChange).toHaveBeenCalled();
    });
  });
});
