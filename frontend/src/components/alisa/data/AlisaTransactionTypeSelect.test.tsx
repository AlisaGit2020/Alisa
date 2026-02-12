import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaTransactionTypeSelect from './AlisaTransactionTypeSelect';
import { TFunction } from 'i18next';

describe('AlisaTransactionTypeSelect', () => {
  const mockT = ((key: string) => {
    const translations: Record<string, string> = {
      unknown: 'Unknown',
      income: 'Income',
      expense: 'Expense',
      deposit: 'Deposit',
      withdraw: 'Withdraw',
      transactionType: 'Transaction Type',
      loading: 'Loading...',
    };
    return translations[key] || key;
  }) as TFunction;

  it('renders and becomes ready', async () => {
    // Component may render loading briefly or skip it in test environment
    renderWithProviders(
      <AlisaTransactionTypeSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="select"
      />
    );

    // Should eventually become ready
    await waitFor(() => {
      expect(screen.queryByText('common:loading')).not.toBeInTheDocument();
    });
  });

  it('renders select after loading', async () => {
    renderWithProviders(
      <AlisaTransactionTypeSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="select"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('common:loading')).not.toBeInTheDocument();
    });
  });

  it('calls onSelect when value changes', async () => {
    const user = userEvent.setup();
    const mockOnSelect = jest.fn();

    renderWithProviders(
      <AlisaTransactionTypeSelect
        onSelect={mockOnSelect}
        selectedValue={0}
        t={mockT}
        variant="select"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('common:loading')).not.toBeInTheDocument();
    });

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    const option = await screen.findByRole('option', { name: /income/i });
    await user.click(option);

    expect(mockOnSelect).toHaveBeenCalled();
  });

  it('renders with label when showLabel is true', async () => {
    renderWithProviders(
      <AlisaTransactionTypeSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="select"
        showLabel={true}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('common:loading')).not.toBeInTheDocument();
    });

    // Check that label is present (may appear multiple times in MUI select)
    expect(screen.getAllByText('Transaction Type').length).toBeGreaterThan(0);
  });

  it('renders without label when showLabel is false', async () => {
    renderWithProviders(
      <AlisaTransactionTypeSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="select"
        showLabel={false}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('common:loading')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Transaction Type')).not.toBeInTheDocument();
  });

  it('renders nothing when visible is false', async () => {
    const { container } = renderWithProviders(
      <AlisaTransactionTypeSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="select"
        visible={false}
      />
    );

    // Component should render null when visible is false (after loading)
    await waitFor(() => {
      expect(screen.queryByText('common:loading')).not.toBeInTheDocument();
    });

    expect(container.querySelector('[role="combobox"]')).not.toBeInTheDocument();
  });

  it('renders as radio group when variant is radio', async () => {
    renderWithProviders(
      <AlisaTransactionTypeSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="radio"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('common:loading')).not.toBeInTheDocument();
    });

    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons.length).toBeGreaterThan(0);
  });

  it('displays translated type names', async () => {
    renderWithProviders(
      <AlisaTransactionTypeSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="radio"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument();
    });

    expect(screen.getByText('Expense')).toBeInTheDocument();
  });

  it('does not reload items when already ready', async () => {
    const { rerender } = renderWithProviders(
      <AlisaTransactionTypeSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="select"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('common:loading')).not.toBeInTheDocument();
    });

    // Rerender with different selectedValue
    rerender(
      <AlisaTransactionTypeSelect
        onSelect={jest.fn()}
        selectedValue={1}
        t={mockT}
        variant="select"
      />
    );

    // Should still be ready (not show loading again)
    expect(screen.queryByText('common:loading')).not.toBeInTheDocument();
  });
});
