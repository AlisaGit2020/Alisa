import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaDependencyDialog from './AlisaDependencyDialog';
import { DeleteValidationResult } from '@alisa-types';

describe('AlisaDependencyDialog', () => {
  const mockValidationResult: DeleteValidationResult = {
    canDelete: false,
    dependencies: [
      {
        type: 'transaction',
        count: 5,
        samples: [
          { id: 1, description: 'Transaction 1' },
          { id: 2, description: 'Transaction 2' },
          { id: 3, description: 'Transaction 3' },
        ],
      },
      {
        type: 'expense',
        count: 2,
        samples: [
          { id: 1, description: 'Expense 1' },
          { id: 2, description: 'Expense 2' },
        ],
      },
    ],
    message: 'Property has related data',
  };

  it('renders dialog with dependency groups', () => {
    renderWithProviders(
      <AlisaDependencyDialog
        open={true}
        validationResult={mockValidationResult}
        onClose={jest.fn()}
        onConfirmDelete={jest.fn()}
      />
    );

    expect(screen.getByText('dependencies.deleteWarningTitle')).toBeInTheDocument();
    expect(screen.getByText('dependencies.deleteWarning')).toBeInTheDocument();
    expect(screen.getByText('dependencies.transactions')).toBeInTheDocument();
    expect(screen.getByText('dependencies.expenses')).toBeInTheDocument();
  });

  it('shows count chips for each dependency type', () => {
    renderWithProviders(
      <AlisaDependencyDialog
        open={true}
        validationResult={mockValidationResult}
        onClose={jest.fn()}
        onConfirmDelete={jest.fn()}
      />
    );

    const transactionCount = screen.getByTestId('transaction-count');
    expect(transactionCount).toHaveTextContent('5');

    const expenseCount = screen.getByTestId('expense-count');
    expect(expenseCount).toHaveTextContent('2');
  });

  it('expands to show sample items when clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AlisaDependencyDialog
        open={true}
        validationResult={mockValidationResult}
        onClose={jest.fn()}
        onConfirmDelete={jest.fn()}
      />
    );

    // Click on the transaction accordion to expand it
    const transactionAccordion = screen.getByText('dependencies.transactions');
    await user.click(transactionAccordion);

    // Check that sample items are visible
    expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    expect(screen.getByText('Transaction 2')).toBeInTheDocument();
    expect(screen.getByText('Transaction 3')).toBeInTheDocument();
  });

  it('shows "and X more" message when samples < total count', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AlisaDependencyDialog
        open={true}
        validationResult={mockValidationResult}
        onClose={jest.fn()}
        onConfirmDelete={jest.fn()}
      />
    );

    // Click on the transaction accordion to expand it
    const transactionAccordion = screen.getByText('dependencies.transactions');
    await user.click(transactionAccordion);

    // Should show "...and 2 more" since we have 5 total but only 3 samples
    expect(screen.getByText('dependencies.andMore')).toBeInTheDocument();
  });

  it('does not show "and X more" when all items are shown', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AlisaDependencyDialog
        open={true}
        validationResult={mockValidationResult}
        onClose={jest.fn()}
        onConfirmDelete={jest.fn()}
      />
    );

    // Click on the expense accordion to expand it
    const expenseAccordion = screen.getByText('dependencies.expenses');
    await user.click(expenseAccordion);

    // Expense has count=2 and samples.length=2, so no "and X more" should appear
    // Need to get the accordion content area
    const accordionDetails = screen.getAllByRole('region');
    // The expense accordion should not have the "and X more" text
    const expenseDetails = accordionDetails.find(region =>
      within(region).queryByText('Expense 1')
    );

    if (expenseDetails) {
      expect(within(expenseDetails).queryByText('dependencies.andMore')).not.toBeInTheDocument();
    }
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    renderWithProviders(
      <AlisaDependencyDialog
        open={true}
        validationResult={mockValidationResult}
        onClose={mockOnClose}
        onConfirmDelete={jest.fn()}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'cancel' });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirmDelete when delete all button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    const mockOnConfirmDelete = jest.fn();

    renderWithProviders(
      <AlisaDependencyDialog
        open={true}
        validationResult={mockValidationResult}
        onClose={mockOnClose}
        onConfirmDelete={mockOnConfirmDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'dependencies.deleteConfirm' });
    await user.click(deleteButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirmDelete).toHaveBeenCalledTimes(1);
  });

  it('does not render when open is false', () => {
    renderWithProviders(
      <AlisaDependencyDialog
        open={false}
        validationResult={mockValidationResult}
        onClose={jest.fn()}
        onConfirmDelete={jest.fn()}
      />
    );

    expect(screen.queryByText('dependencies.deleteWarningTitle')).not.toBeInTheDocument();
  });

  it('does not render when validationResult is null', () => {
    renderWithProviders(
      <AlisaDependencyDialog
        open={true}
        validationResult={null}
        onClose={jest.fn()}
        onConfirmDelete={jest.fn()}
      />
    );

    expect(screen.queryByText('dependencies.deleteWarningTitle')).not.toBeInTheDocument();
  });

  it('renders all dependency types correctly', () => {
    const fullValidationResult: DeleteValidationResult = {
      canDelete: false,
      dependencies: [
        { type: 'transaction', count: 1, samples: [{ id: 1, description: 'T1' }] },
        { type: 'expense', count: 1, samples: [{ id: 1, description: 'E1' }] },
        { type: 'income', count: 1, samples: [{ id: 1, description: 'I1' }] },
        { type: 'statistics', count: 1, samples: [{ id: 1, description: 'S1' }] },
        { type: 'depreciationAsset', count: 1, samples: [{ id: 1, description: 'D1' }] },
      ],
    };

    renderWithProviders(
      <AlisaDependencyDialog
        open={true}
        validationResult={fullValidationResult}
        onClose={jest.fn()}
        onConfirmDelete={jest.fn()}
      />
    );

    expect(screen.getByText('dependencies.transactions')).toBeInTheDocument();
    expect(screen.getByText('dependencies.expenses')).toBeInTheDocument();
    expect(screen.getByText('dependencies.incomes')).toBeInTheDocument();
    expect(screen.getByText('dependencies.statistics')).toBeInTheDocument();
    expect(screen.getByText('dependencies.depreciationAssets')).toBeInTheDocument();
  });
});
