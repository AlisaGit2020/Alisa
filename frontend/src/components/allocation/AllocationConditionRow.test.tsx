// frontend/src/components/allocation/AllocationConditionRow.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AllocationConditionRow from './AllocationConditionRow';
import { AllocationCondition } from '@asset-types';
import { TFunction } from 'i18next';

const mockT = ((key: string) => {
  const translations: Record<string, string> = {
    'allocation:field': 'Field',
    'allocation:operator': 'Operator',
    'allocation:value': 'Value',
    'allocation:field.sender': 'Sender',
    'allocation:field.receiver': 'Receiver',
    'allocation:field.description': 'Description',
    'allocation:field.amount': 'Amount',
    'allocation:operator.equals': 'Equals',
    'allocation:operator.contains': 'Contains',
    'allocation:operator.greaterThan': 'Greater than',
    'allocation:operator.lessThan': 'Less than',
    'common:delete': 'Delete',
  };
  return translations[key] || key;
}) as unknown as TFunction;

describe('AllocationConditionRow', () => {
  const defaultCondition: AllocationCondition = {
    field: 'description',
    operator: 'contains',
    value: 'test value',
  };

  const defaultProps = {
    condition: defaultCondition,
    index: 0,
    t: mockT,
    onChange: jest.fn(),
    onRemove: jest.fn(),
    showRemove: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders field selector', () => {
      render(<AllocationConditionRow {...defaultProps} />);

      // MUI Select renders as combobox
      expect(screen.getByRole('combobox', { name: 'Field' })).toBeInTheDocument();
    });

    it('renders operator selector', () => {
      render(<AllocationConditionRow {...defaultProps} />);

      expect(screen.getByRole('combobox', { name: 'Operator' })).toBeInTheDocument();
    });

    it('renders value input', () => {
      render(<AllocationConditionRow {...defaultProps} />);

      expect(screen.getByRole('textbox', { name: 'Value' })).toBeInTheDocument();
    });

    it('renders remove button when showRemove is true', () => {
      render(<AllocationConditionRow {...defaultProps} showRemove={true} />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('does not render remove button when showRemove is false', () => {
      render(<AllocationConditionRow {...defaultProps} showRemove={false} />);

      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });
  });

  describe('Value handling', () => {
    it('displays the condition value', () => {
      render(<AllocationConditionRow {...defaultProps} />);

      expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
    });

    it('calls onChange when value is changed', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();

      render(<AllocationConditionRow {...defaultProps} onChange={mockOnChange} />);

      const valueInput = screen.getByRole('textbox', { name: 'Value' });
      await user.clear(valueInput);
      await user.type(valueInput, 'new value');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Remove action', () => {
    it('calls onRemove with correct index when remove button clicked', async () => {
      const user = userEvent.setup();
      const mockOnRemove = jest.fn();

      render(<AllocationConditionRow {...defaultProps} index={2} onRemove={mockOnRemove} />);

      await user.click(screen.getByRole('button', { name: 'Delete' }));

      expect(mockOnRemove).toHaveBeenCalledWith(2);
    });
  });

  describe('Operator switching based on field type', () => {
    it('shows text operators for text fields', async () => {
      const user = userEvent.setup();

      render(<AllocationConditionRow {...defaultProps} />);

      // Open operator dropdown
      const operatorSelect = screen.getByRole('combobox', { name: 'Operator' });
      await user.click(operatorSelect);

      // Text operators should be available - use getAllByText since they may appear in both select display and option list
      expect(screen.getAllByText('Equals').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Contains').length).toBeGreaterThan(0);
    });

    it('shows numeric operators for amount field', async () => {
      const user = userEvent.setup();
      const numericCondition: AllocationCondition = {
        field: 'amount',
        operator: 'equals',
        value: '100',
      };

      render(<AllocationConditionRow {...defaultProps} condition={numericCondition} />);

      // Open operator dropdown
      const operatorSelect = screen.getByRole('combobox', { name: 'Operator' });
      await user.click(operatorSelect);

      // Numeric operators should be available - use getAllByText since 'Equals' may appear multiple times
      expect(screen.getAllByText('Equals').length).toBeGreaterThan(0);
      expect(screen.getByText('Greater than')).toBeInTheDocument();
      expect(screen.getByText('Less than')).toBeInTheDocument();
    });
  });
});
