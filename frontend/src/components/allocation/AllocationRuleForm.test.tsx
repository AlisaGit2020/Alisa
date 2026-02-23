// frontend/src/components/allocation/AllocationRuleForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AllocationRuleForm from './AllocationRuleForm';
import { AllocationRule, TransactionType } from '@asset-types';
import { TFunction } from 'i18next';

const mockT = ((key: string) => {
  const translations: Record<string, string> = {
    'allocation:ruleName': 'Rule Name',
    'allocation:transactionType': 'Transaction Type',
    'allocation:expenseType': 'Expense Type',
    'allocation:incomeType': 'Income Type',
    'allocation:conditions': 'Conditions',
    'allocation:addCondition': 'Add Condition',
    'allocation:active': 'Active',
    'allocation:atLeastOneCondition': 'At least one condition is required',
    'allocation:field': 'Field',
    'allocation:operator': 'Operator',
    'allocation:value': 'Value',
    'allocation:field.sender': 'Sender',
    'allocation:field.receiver': 'Receiver',
    'allocation:field.description': 'Description',
    'allocation:field.amount': 'Amount',
    'allocation:operator.equals': 'Equals',
    'allocation:operator.contains': 'Contains',
    'common:validation.required': 'This field is required',
    'common:delete': 'Delete',
    'transaction:expense': 'Expense',
    'transaction:income': 'Income',
    'transaction:deposit': 'Deposit',
    'transaction:withdraw': 'Withdraw',
  };
  return translations[key] || key;
}) as unknown as TFunction;

describe('AllocationRuleForm', () => {
  const defaultRule: Partial<AllocationRule> = {
    name: 'Test Rule',
    transactionType: TransactionType.EXPENSE,
    conditions: [{ field: 'description', operator: 'contains', value: 'rent' }],
    isActive: true,
  };

  const defaultExpenseTypes = [
    { id: 1, key: 'maintenance' },
    { id: 2, key: 'utilities' },
  ];

  const defaultIncomeTypes = [
    { id: 1, key: 'rent' },
    { id: 2, key: 'airbnb' },
  ];

  const defaultProps = {
    rule: defaultRule,
    expenseTypes: defaultExpenseTypes,
    incomeTypes: defaultIncomeTypes,
    t: mockT,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders rule name input', () => {
      render(<AllocationRuleForm {...defaultProps} />);

      expect(screen.getByRole('textbox', { name: 'Rule Name' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
    });

    it('renders transaction type selector', () => {
      render(<AllocationRuleForm {...defaultProps} />);

      expect(screen.getByRole('combobox', { name: 'Transaction Type' })).toBeInTheDocument();
    });

    it('renders conditions section', () => {
      render(<AllocationRuleForm {...defaultProps} />);

      expect(screen.getByText('Conditions')).toBeInTheDocument();
    });

    it('renders add condition button', () => {
      render(<AllocationRuleForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Add Condition/i })).toBeInTheDocument();
    });

    it('renders active switch', () => {
      render(<AllocationRuleForm {...defaultProps} />);

      // The switch label is rendered as text
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Category type visibility', () => {
    it('shows expense type selector when transaction type is EXPENSE', () => {
      render(
        <AllocationRuleForm
          {...defaultProps}
          rule={{ ...defaultRule, transactionType: TransactionType.EXPENSE }}
        />
      );

      expect(screen.getByRole('combobox', { name: 'Expense Type' })).toBeInTheDocument();
      expect(screen.queryByRole('combobox', { name: 'Income Type' })).not.toBeInTheDocument();
    });

    it('shows income type selector when transaction type is INCOME', () => {
      render(
        <AllocationRuleForm
          {...defaultProps}
          rule={{ ...defaultRule, transactionType: TransactionType.INCOME }}
        />
      );

      expect(screen.getByRole('combobox', { name: 'Income Type' })).toBeInTheDocument();
      expect(screen.queryByRole('combobox', { name: 'Expense Type' })).not.toBeInTheDocument();
    });

    it('hides category selectors when transaction type is DEPOSIT', () => {
      render(
        <AllocationRuleForm
          {...defaultProps}
          rule={{ ...defaultRule, transactionType: TransactionType.DEPOSIT }}
        />
      );

      expect(screen.queryByRole('combobox', { name: 'Expense Type' })).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox', { name: 'Income Type' })).not.toBeInTheDocument();
    });
  });

  describe('onChange callbacks', () => {
    it('calls onChange when name is changed', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();

      render(<AllocationRuleForm {...defaultProps} onChange={mockOnChange} />);

      const nameInput = screen.getByRole('textbox', { name: 'Rule Name' });
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('calls onChange when add condition button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();

      render(<AllocationRuleForm {...defaultProps} onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /Add Condition/i }));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          conditions: expect.arrayContaining([
            expect.objectContaining({ field: 'description' }),
            expect.objectContaining({ field: 'description', operator: 'contains', value: '' }),
          ]),
        })
      );
    });

    it('calls onChange when active switch is toggled', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();

      render(<AllocationRuleForm {...defaultProps} onChange={mockOnChange} />);

      // Find the switch by clicking on its label text
      const activeLabel = screen.getByText('Active');
      await user.click(activeLabel);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false })
      );
    });
  });

  describe('Error display', () => {
    it('displays name error when provided', () => {
      render(
        <AllocationRuleForm
          {...defaultProps}
          errors={{ name: 'This field is required' }}
        />
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('displays conditions error when provided', () => {
      render(
        <AllocationRuleForm
          {...defaultProps}
          errors={{ conditions: 'At least one condition is required' }}
        />
      );

      expect(screen.getByText('At least one condition is required')).toBeInTheDocument();
    });
  });

  describe('Conditions', () => {
    it('renders existing conditions', () => {
      render(<AllocationRuleForm {...defaultProps} />);

      expect(screen.getByDisplayValue('rent')).toBeInTheDocument();
    });

    it('renders multiple conditions', () => {
      const ruleWithMultipleConditions: Partial<AllocationRule> = {
        ...defaultRule,
        conditions: [
          { field: 'description', operator: 'contains', value: 'rent' },
          { field: 'sender', operator: 'equals', value: 'tenant' },
        ],
      };

      render(
        <AllocationRuleForm {...defaultProps} rule={ruleWithMultipleConditions} />
      );

      expect(screen.getByDisplayValue('rent')).toBeInTheDocument();
      expect(screen.getByDisplayValue('tenant')).toBeInTheDocument();
    });
  });
});
