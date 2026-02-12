import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaTransactionStatusSelect from './AlisaTransactionStatusSelect';
import { TFunction } from 'i18next';

describe('AlisaTransactionStatusSelect', () => {
  const mockT = ((key: string) => {
    const translations: Record<string, string> = {
      pending: 'Pending',
      accepted: 'Accepted',
      transactionStatus: 'Transaction Status',
    };
    return translations[key] || key;
  }) as TFunction;

  it('renders and becomes ready', async () => {
    // Component may render loading briefly or skip it in test environment
    renderWithProviders(
      <AlisaTransactionStatusSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="select"
      />
    );

    // Should eventually become ready
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('renders select after loading', async () => {
    renderWithProviders(
      <AlisaTransactionStatusSelect
        onSelect={jest.fn()}
        t={mockT}
        variant="select"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('renders with selected value', async () => {
    renderWithProviders(
      <AlisaTransactionStatusSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="select"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('calls onSelect when value changes', async () => {
    const user = userEvent.setup();
    const mockOnSelect = jest.fn();

    renderWithProviders(
      <AlisaTransactionStatusSelect
        onSelect={mockOnSelect}
        selectedValue={0}
        t={mockT}
        variant="select"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    const option = await screen.findByRole('option', { name: /accepted/i });
    await user.click(option);

    expect(mockOnSelect).toHaveBeenCalled();
  });

  it('renders with label when showLabel is true', async () => {
    renderWithProviders(
      <AlisaTransactionStatusSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="select"
        showLabel={true}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check that label is present (may appear multiple times in MUI select)
    expect(screen.getAllByText('Transaction Status').length).toBeGreaterThan(0);
  });

  it('renders without label when showLabel is false', async () => {
    renderWithProviders(
      <AlisaTransactionStatusSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="select"
        showLabel={false}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Transaction Status')).not.toBeInTheDocument();
  });

  it('renders as radio group when variant is radio', async () => {
    renderWithProviders(
      <AlisaTransactionStatusSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="radio"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons.length).toBeGreaterThan(0);
  });

  it('displays translated status names', async () => {
    renderWithProviders(
      <AlisaTransactionStatusSelect
        onSelect={jest.fn()}
        selectedValue={0}
        t={mockT}
        variant="radio"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });
});
