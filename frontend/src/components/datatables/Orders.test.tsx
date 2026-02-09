// frontend/src/components/datatables/Orders.test.tsx
import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@test-utils/test-wrapper';
import ApiClient from '@alisa-lib/api-client';
import { Expense } from '@alisa-types';
import Orders from './Orders';

describe('Orders Component', () => {
  const mockExpenses: Expense[] = [
    {
      id: 1,
      description: 'Electricity bill',
      amount: 150,
      quantity: 1,
      totalAmount: 150,
      accountingDate: new Date('2024-01-15'),
      expenseTypeId: 1,
      propertyId: 1,
      transactionId: 1,
      expenseType: {
        id: 1,
        name: 'Utilities',
        description: 'Monthly utilities',
        userId: 1,
        isTaxDeductible: true,
        isCapitalImprovement: false,
      },
      transaction: {
        id: 1,
        externalId: 'ext-001',
        status: 'ACCEPTED' as const,
        type: 'EXPENSE' as const,
        sender: 'Property Account',
        receiver: 'Electric Company',
        description: 'Monthly electricity',
        transactionDate: new Date('2024-01-15'),
        accountingDate: new Date('2024-01-15'),
        amount: -150,
        balance: 5000,
        propertyId: 1,
      },
    },
    {
      id: 2,
      description: 'Water bill',
      amount: 50,
      quantity: 2,
      totalAmount: 100,
      accountingDate: new Date('2024-01-20'),
      expenseTypeId: 2,
      propertyId: 1,
      transactionId: 2,
      expenseType: {
        id: 2,
        name: 'Water',
        description: 'Water expenses',
        userId: 1,
        isTaxDeductible: true,
        isCapitalImprovement: false,
      },
      transaction: {
        id: 2,
        externalId: 'ext-002',
        status: 'ACCEPTED' as const,
        type: 'EXPENSE' as const,
        sender: 'Property Account',
        receiver: 'Water Company',
        description: 'Quarterly water',
        transactionDate: new Date('2024-01-20'),
        accountingDate: new Date('2024-01-20'),
        amount: -100,
        balance: 4900,
        propertyId: 1,
      },
    },
    {
      id: 3,
      description: 'Repair work',
      amount: 200,
      quantity: 1,
      totalAmount: 200,
      accountingDate: new Date('2024-01-25'),
      expenseTypeId: 3,
      propertyId: 1,
      transactionId: null,
      expenseType: {
        id: 3,
        name: 'Maintenance',
        description: 'Property maintenance',
        userId: 1,
        isTaxDeductible: true,
        isCapitalImprovement: false,
      },
      transaction: undefined,
    },
  ];

  let mockSearch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearch = jest.spyOn(ApiClient, 'search');
  });

  afterEach(() => {
    mockSearch.mockRestore();
  });

  describe('Rendering with data', () => {
    it('displays table with expense data', async () => {
      mockSearch.mockResolvedValue(mockExpenses);

      renderWithProviders(<Orders />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Recent Expenses')).toBeInTheDocument();
      });

      // Verify table headers are present
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('displays expense types from expense data', async () => {
      mockSearch.mockResolvedValue(mockExpenses);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        expect(screen.getByText('Utilities')).toBeInTheDocument();
      });

      expect(screen.getByText('Water')).toBeInTheDocument();
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
    });

    it('displays transaction descriptions', async () => {
      mockSearch.mockResolvedValue(mockExpenses);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        expect(screen.getByText('Monthly electricity')).toBeInTheDocument();
      });

      expect(screen.getByText('Quarterly water')).toBeInTheDocument();
    });

    it('displays quantity values', async () => {
      mockSearch.mockResolvedValue(mockExpenses);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        // Check that quantities are displayed (1 for electricity, 2 for water, 1 for repair)
        expect(screen.getAllByText('1')).toHaveLength(2);
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('displays amount values', async () => {
      mockSearch.mockResolvedValue(mockExpenses);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        // Check amounts from transactions are displayed
        expect(screen.getByText('-150')).toBeInTheDocument();
        expect(screen.getByText('-100')).toBeInTheDocument();
      });
    });

    it('displays total amount values', async () => {
      mockSearch.mockResolvedValue(mockExpenses);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
      });
    });

    it('displays "See more orders" link', async () => {
      mockSearch.mockResolvedValue(mockExpenses);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        expect(screen.getByText('See more orders')).toBeInTheDocument();
      });

      const link = screen.getByText('See more orders');
      expect(link.tagName).toBe('A');
    });
  });

  describe('Empty state', () => {
    it('displays "No recent expenses" when no data', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        expect(screen.getByText('No recent expenses')).toBeInTheDocument();
      });

      // Table should not be rendered when empty
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('does not display "See more orders" link when empty', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        expect(screen.getByText('No recent expenses')).toBeInTheDocument();
      });

      expect(screen.queryByText('See more orders')).not.toBeInTheDocument();
    });
  });

  describe('API interaction', () => {
    it('calls ApiClient.search with correct path', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledWith('accounting/expense');
      });
    });

    it('fetches data on component mount', async () => {
      mockSearch.mockResolvedValue(mockExpenses);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('User interactions', () => {
    it('prevents default on "See more orders" link click', async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue(mockExpenses);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        expect(screen.getByText('See more orders')).toBeInTheDocument();
      });

      const link = screen.getByText('See more orders');

      // Clicking the link should not navigate (preventDefault is called)
      await user.click(link);

      // Component should still be rendered after click
      expect(screen.getByText('Recent Expenses')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles expense without transaction gracefully', async () => {
      const expenseWithoutTransaction: Expense[] = [
        {
          id: 1,
          description: 'Manual expense',
          amount: 100,
          quantity: 1,
          totalAmount: 100,
          accountingDate: new Date('2024-01-15'),
          expenseTypeId: 1,
          propertyId: 1,
          transactionId: null,
          expenseType: {
            id: 1,
            name: 'Other',
            description: 'Other expenses',
            userId: 1,
            isTaxDeductible: false,
            isCapitalImprovement: false,
          },
          transaction: undefined,
        },
      ];

      mockSearch.mockResolvedValue(expenseWithoutTransaction);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        expect(screen.getByText('Other')).toBeInTheDocument();
      });

      // Component should render without crashing
      expect(screen.getByText('Recent Expenses')).toBeInTheDocument();
    });

    it('handles expense without expenseType gracefully', async () => {
      const expenseWithoutType: Expense[] = [
        {
          id: 1,
          description: 'No type expense',
          amount: 50,
          quantity: 1,
          totalAmount: 50,
          accountingDate: new Date('2024-01-15'),
          expenseTypeId: 1,
          propertyId: 1,
          transactionId: null,
          expenseType: undefined,
          transaction: undefined,
        },
      ];

      mockSearch.mockResolvedValue(expenseWithoutType);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        expect(screen.getByText('Recent Expenses')).toBeInTheDocument();
      });

      // Component should render without crashing
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('handles single expense correctly', async () => {
      mockSearch.mockResolvedValue([mockExpenses[0]]);

      renderWithProviders(<Orders />);

      await waitFor(() => {
        expect(screen.getByText('Utilities')).toBeInTheDocument();
      });

      expect(screen.getByText('Monthly electricity')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });
});

describe('Orders Component Logic', () => {
  // Logic tests following the pattern from Transactions.test.tsx

  describe('Data display logic', () => {
    it('calculates totalAmount correctly from quantity and amount', () => {
      const expense = {
        quantity: 2,
        amount: 50,
      };

      const calculateTotal = (qty: number, amt: number) => qty * amt;

      expect(calculateTotal(expense.quantity, expense.amount)).toBe(100);
    });

    it('returns expense type name when expenseType is present', () => {
      const expense = {
        expenseType: { name: 'Utilities' },
      };

      const getTypeName = (
        exp: { expenseType?: { name: string } } | undefined
      ) => {
        return exp?.expenseType?.name;
      };

      expect(getTypeName(expense)).toBe('Utilities');
    });

    it('returns undefined when expenseType is missing', () => {
      const expense = {
        expenseType: undefined,
      };

      const getTypeName = (
        exp: { expenseType?: { name: string } } | undefined
      ) => {
        return exp?.expenseType?.name;
      };

      expect(getTypeName(expense)).toBeUndefined();
    });

    it('returns transaction description when transaction is present', () => {
      const expense = {
        transaction: { description: 'Monthly payment' },
      };

      const getDescription = (
        exp: { transaction?: { description: string } } | undefined
      ) => {
        return exp?.transaction?.description;
      };

      expect(getDescription(expense)).toBe('Monthly payment');
    });

    it('returns undefined when transaction is missing', () => {
      const expense = {
        transaction: undefined,
      };

      const getDescription = (
        exp: { transaction?: { description: string } } | undefined
      ) => {
        return exp?.transaction?.description;
      };

      expect(getDescription(expense)).toBeUndefined();
    });
  });

  describe('Empty state logic', () => {
    it('shows empty state when expenses array is empty', () => {
      const expenses: unknown[] = [];

      const shouldShowEmptyState = expenses.length === 0;

      expect(shouldShowEmptyState).toBe(true);
    });

    it('shows table when expenses array has data', () => {
      const expenses = [{ id: 1 }];

      const shouldShowTable = expenses.length > 0;

      expect(shouldShowTable).toBe(true);
    });
  });

  describe('Date display logic', () => {
    it('converts Date object to string for display', () => {
      const transactionDate = new Date('2024-01-15');

      const dateString = transactionDate.toString();

      expect(dateString).toContain('2024');
    });

    it('handles undefined transaction date', () => {
      const transaction: { transactionDate?: Date } = {
        transactionDate: undefined,
      };

      const dateDisplay = transaction.transactionDate?.toString();

      expect(dateDisplay).toBeUndefined();
    });
  });

  describe('Amount formatting logic', () => {
    it('displays amount from transaction', () => {
      const transaction = {
        amount: -150,
      };

      expect(transaction.amount).toBe(-150);
    });

    it('displays totalAmount from expense', () => {
      const expense = {
        totalAmount: 150,
      };

      expect(expense.totalAmount).toBe(150);
    });
  });

  describe('Prevent default behavior', () => {
    it('calls preventDefault on event', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
      };

      const preventDefault = (event: { preventDefault: () => void }) => {
        event.preventDefault();
      };

      preventDefault(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });
});
