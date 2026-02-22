import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import TransactionCategoryChips from './TransactionCategoryChips';
import { Transaction, TransactionStatus, TransactionType } from '@alisa-types';

describe('TransactionCategoryChips', () => {
  const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 1,
    externalId: 'ext-1',
    status: TransactionStatus.ACCEPTED,
    type: TransactionType.EXPENSE,
    sender: 'Test Sender',
    receiver: 'Test Receiver',
    description: 'Test Description',
    transactionDate: new Date('2024-01-15'),
    accountingDate: new Date('2024-01-15'),
    amount: -100,
    balance: 1000,
    propertyId: 1,
    ...overrides,
  });

  it('renders expense type as text', () => {
    const transaction = createTransaction({
      expenses: [
        {
          id: 1,
          description: 'Expense 1',
          amount: 50,
          quantity: 1,
          totalAmount: 50,
          accountingDate: new Date(),
          expenseTypeId: 1,
          propertyId: 1,
          transactionId: 1,
          expenseType: { id: 1, name: 'Utilities', description: '', isTaxDeductible: true, isCapitalImprovement: false, key: 'test-key' },
        },
      ],
    });

    renderWithProviders(<TransactionCategoryChips transaction={transaction} />);

    expect(screen.getByText('Utilities')).toBeInTheDocument();
  });

  it('renders income type as text', () => {
    const transaction = createTransaction({
      type: TransactionType.INCOME,
      incomes: [
        {
          id: 1,
          description: 'Income 1',
          amount: 100,
          quantity: 1,
          totalAmount: 100,
          accountingDate: new Date(),
          incomeTypeId: 1,
          propertyId: 1,
          transactionId: 1,
          incomeType: { id: 1, name: 'Rent', description: '', isTaxable: true, key: 'test-key' },
        },
      ],
    });

    renderWithProviders(<TransactionCategoryChips transaction={transaction} />);

    expect(screen.getByText('Rent')).toBeInTheDocument();
  });

  it('shows only first category with +N badge when multiple categories exist', () => {
    const transaction = createTransaction({
      expenses: [
        {
          id: 1,
          description: 'Expense 1',
          amount: 50,
          quantity: 1,
          totalAmount: 50,
          accountingDate: new Date(),
          expenseTypeId: 1,
          propertyId: 1,
          transactionId: 1,
          expenseType: { id: 1, name: 'Utilities', description: '', isTaxDeductible: true, isCapitalImprovement: false, key: 'test-key' },
        },
        {
          id: 2,
          description: 'Expense 2',
          amount: 50,
          quantity: 1,
          totalAmount: 50,
          accountingDate: new Date(),
          expenseTypeId: 2,
          propertyId: 1,
          transactionId: 1,
          expenseType: { id: 2, name: 'Repairs', description: '', isTaxDeductible: true, isCapitalImprovement: false, key: 'test-key' },
        },
        {
          id: 3,
          description: 'Expense 3',
          amount: 40,
          quantity: 1,
          totalAmount: 40,
          accountingDate: new Date(),
          expenseTypeId: 3,
          propertyId: 1,
          transactionId: 1,
          expenseType: { id: 3, name: 'Insurance', description: '', isTaxDeductible: true, isCapitalImprovement: false, key: 'test-key' },
        },
      ],
    });

    renderWithProviders(<TransactionCategoryChips transaction={transaction} />);

    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.queryByText('Repairs')).not.toBeInTheDocument();
    expect(screen.queryByText('Insurance')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('shows tooltip with all categories on hover when multiple exist', async () => {
    const user = userEvent.setup();
    const transaction = createTransaction({
      expenses: [
        {
          id: 1,
          description: 'Expense 1',
          amount: 50,
          quantity: 1,
          totalAmount: 50,
          accountingDate: new Date(),
          expenseTypeId: 1,
          propertyId: 1,
          transactionId: 1,
          expenseType: { id: 1, name: 'Utilities', description: '', isTaxDeductible: true, isCapitalImprovement: false, key: 'test-key' },
        },
        {
          id: 2,
          description: 'Expense 2',
          amount: 50,
          quantity: 1,
          totalAmount: 50,
          accountingDate: new Date(),
          expenseTypeId: 2,
          propertyId: 1,
          transactionId: 1,
          expenseType: { id: 2, name: 'Repairs', description: '', isTaxDeductible: true, isCapitalImprovement: false, key: 'test-key' },
        },
      ],
    });

    renderWithProviders(<TransactionCategoryChips transaction={transaction} />);

    // Hover over the text to trigger tooltip
    await user.hover(screen.getByText('Utilities'));

    // Tooltip should show all categories
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Utilities, Repairs');
  });

  it('renders nothing when no expenses or incomes', () => {
    const transaction = createTransaction({
      expenses: [],
      incomes: [],
    });

    const { container } = renderWithProviders(<TransactionCategoryChips transaction={transaction} />);

    expect(container.textContent).toBe('');
  });

  it('renders nothing when expenses and incomes are undefined', () => {
    const transaction = createTransaction({
      expenses: undefined,
      incomes: undefined,
    });

    const { container } = renderWithProviders(<TransactionCategoryChips transaction={transaction} />);

    expect(container.textContent).toBe('');
  });

  it('does not show +N badge when only one category', () => {
    const transaction = createTransaction({
      expenses: [
        {
          id: 1,
          description: 'Expense 1',
          amount: 50,
          quantity: 1,
          totalAmount: 50,
          accountingDate: new Date(),
          expenseTypeId: 1,
          propertyId: 1,
          transactionId: 1,
          expenseType: { id: 1, name: 'Utilities', description: '', isTaxDeductible: true, isCapitalImprovement: false, key: 'test-key' },
        },
      ],
    });

    renderWithProviders(<TransactionCategoryChips transaction={transaction} />);

    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument();
  });

  it('deduplicates categories with same name', () => {
    const transaction = createTransaction({
      expenses: [
        {
          id: 1,
          description: 'Expense 1',
          amount: 30,
          quantity: 1,
          totalAmount: 30,
          accountingDate: new Date(),
          expenseTypeId: 1,
          propertyId: 1,
          transactionId: 1,
          expenseType: { id: 1, name: 'Utilities', description: '', isTaxDeductible: true, isCapitalImprovement: false, key: 'test-key' },
        },
        {
          id: 2,
          description: 'Expense 2',
          amount: 40,
          quantity: 1,
          totalAmount: 40,
          accountingDate: new Date(),
          expenseTypeId: 1,
          propertyId: 1,
          transactionId: 1,
          expenseType: { id: 1, name: 'Utilities', description: '', isTaxDeductible: true, isCapitalImprovement: false, key: 'test-key' },
        },
        {
          id: 3,
          description: 'Expense 3',
          amount: 30,
          quantity: 1,
          totalAmount: 30,
          accountingDate: new Date(),
          expenseTypeId: 2,
          propertyId: 1,
          transactionId: 1,
          expenseType: { id: 2, name: 'Repairs', description: '', isTaxDeductible: true, isCapitalImprovement: false, key: 'test-key' },
        },
      ],
    });

    renderWithProviders(<TransactionCategoryChips transaction={transaction} />);

    // Should show "Utilities" and "+1" (for Repairs), not "+2"
    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });
});
