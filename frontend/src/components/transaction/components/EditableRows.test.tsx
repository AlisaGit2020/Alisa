import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { TransactionInput, TransactionType } from '@asset-types';
import EditableRows from './EditableRows';
import ApiClient from '@asset-lib/api-client';

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

  const mockTransaction: TransactionInput = {
    id: 1,
    amount: 1000,
    description: 'Test transaction',
    sender: 'Test Sender',
    receiver: 'Test Receiver',
    transactionDate: new Date('2024-01-01'),
    accountingDate: new Date('2024-01-01'),
    expenses: [],
    incomes: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ApiClient.getDefault as unknown as jest.SpyInstance).mockResolvedValue({ ...mockDefaultRow });
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

  it('calculates amount (unitPrice) when changedAmount updates and quantity is 1', async () => {
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

    // Wait for initial row to be created
    await waitFor(() => {
      expect(mockOnHandleChange).toHaveBeenCalled();
    });

    mockOnHandleChange.mockClear();

    // Simulate user entering amount in transaction form which triggers changedAmount
    rerender(
      <EditableRows
        transaction={mockTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription=""
        changedAmount={100}
      />
    );

    // Wait for the effect to run
    await waitFor(() => {
      expect(mockOnHandleChange).toHaveBeenCalled();
    });

    // Get the last call arguments - the expense row should have amount calculated
    const lastCall = mockOnHandleChange.mock.calls[mockOnHandleChange.mock.calls.length - 1];
    const expenseRows = lastCall[0];

    // With quantity=1 and totalAmount=100, amount should be 100 (not 0)
    expect(expenseRows[0].totalAmount).toBe(100);
    expect(expenseRows[0].amount).toBe(100); // This is the bug - amount stays 0
  });

  it('calculates amount (unitPrice) correctly when quantity is greater than 1', async () => {
    const mockOnHandleChange = jest.fn();

    // Start with a row that has quantity = 2
    const transactionWithExpense = {
      ...mockTransaction,
      expenses: [
        {
          id: 0,
          description: '',
          quantity: 2,
          amount: 0,
          totalAmount: 0,
          expenseTypeId: 1,
        },
      ],
    };

    const { rerender } = renderWithProviders(
      <EditableRows
        transaction={transactionWithExpense}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription=""
        changedAmount={0}
      />
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText(/rows/i)).toBeInTheDocument();
    });

    mockOnHandleChange.mockClear();

    // Simulate changedAmount update
    rerender(
      <EditableRows
        transaction={transactionWithExpense}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription=""
        changedAmount={200}
      />
    );

    await waitFor(() => {
      expect(mockOnHandleChange).toHaveBeenCalled();
    });

    const lastCall = mockOnHandleChange.mock.calls[mockOnHandleChange.mock.calls.length - 1];
    const expenseRows = lastCall[0];

    // With quantity=2 and totalAmount=200, amount should be 100
    expect(expenseRows[0].totalAmount).toBe(200);
    expect(expenseRows[0].amount).toBe(100);
  });

  it('syncs data when transaction expenses are loaded (edit mode)', async () => {
    const mockOnHandleChange = jest.fn();

    // Start with transaction that has an ID but no expenses loaded yet
    const initialTransaction = {
      ...mockTransaction,
      id: 123,
      expenses: undefined,
    };

    const { rerender } = renderWithProviders(
      <EditableRows
        transaction={initialTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription=""
        changedAmount={0}
      />
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText(/rows/i)).toBeInTheDocument();
    });

    mockOnHandleChange.mockClear();

    // Now simulate expenses being loaded (like when AssetFormHandler fetches data)
    const loadedExpenses = [
      {
        id: 1,
        description: 'Loaded expense',
        quantity: 1,
        amount: 75.50,
        totalAmount: 75.50,
        expenseTypeId: 1,
      },
    ];

    const updatedTransaction = {
      ...mockTransaction,
      id: 123,
      expenses: loadedExpenses,
    };

    rerender(
      <EditableRows
        transaction={updatedTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription=""
        changedAmount={0}
      />
    );

    // Wait for the sync effect to run
    await waitFor(() => {
      // The data should be synced with the loaded expenses
      // We can verify by checking that the description is rendered
      const descriptionInput = screen.getByDisplayValue('Loaded expense');
      expect(descriptionInput).toBeInTheDocument();
    });
  });

  it('preserves user-entered description when calling onHandleChange', async () => {
    // This test verifies the bug fix for issue #84:
    // User changes expense row description, but the change is not saved
    const user = userEvent.setup();
    const mockOnHandleChange = jest.fn();

    // Start with default row that has default description
    (ApiClient.getDefault as unknown as jest.SpyInstance).mockResolvedValue({
      ...mockDefaultRow,
      description: 'Default Type Name',
      expenseTypeId: 1,
    });

    renderWithProviders(
      <EditableRows
        transaction={mockTransaction}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription=""
        changedAmount={0}
      />
    );

    // Wait for initial row to be created
    await waitFor(() => {
      expect(mockOnHandleChange).toHaveBeenCalled();
    });

    // Find the description input and clear it, then type new description
    const descriptionInput = screen.getByDisplayValue('Default Type Name');
    mockOnHandleChange.mockClear();

    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'User Custom Description');

    // Verify that the final call to onHandleChange includes the user-entered description
    await waitFor(() => {
      const lastCall = mockOnHandleChange.mock.calls[mockOnHandleChange.mock.calls.length - 1];
      const expenseRows = lastCall[0];
      expect(expenseRows[0].description).toBe('User Custom Description');
    });
  });

  it('preserves expenseTypeId when user changes other fields', async () => {
    // This test verifies that expenseTypeId is not lost when other effects run
    const user = userEvent.setup();
    const mockOnHandleChange = jest.fn();

    // Start with a row that has a specific expenseTypeId
    const transactionWithExpense = {
      ...mockTransaction,
      id: 1,
      expenses: [
        {
          id: 0,
          description: 'Test expense',
          quantity: 1,
          amount: 100,
          totalAmount: 100,
          expenseTypeId: 5, // Specific expense type ID
        },
      ],
    };

    renderWithProviders(
      <EditableRows
        transaction={transactionWithExpense}
        type={TransactionType.EXPENSE}
        onHandleChange={mockOnHandleChange}
        changedDescription=""
        changedAmount={0}
      />
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test expense')).toBeInTheDocument();
    });

    mockOnHandleChange.mockClear();

    // Change the description
    const descriptionInput = screen.getByDisplayValue('Test expense');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated expense');

    // Verify that expenseTypeId is preserved in the callback
    await waitFor(() => {
      const lastCall = mockOnHandleChange.mock.calls[mockOnHandleChange.mock.calls.length - 1];
      const expenseRows = lastCall[0];
      expect(expenseRows[0].expenseTypeId).toBe(5);
      expect(expenseRows[0].description).toBe('Updated expense');
    });
  });
});
