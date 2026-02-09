import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaDataTable from './AlisaDataTable';
import { TFunction } from 'i18next';

describe('AlisaDataTable', () => {
  const mockT = ((key: string, options?: Record<string, unknown>) => {
    if (key === 'format.currency.euro' && options?.val !== undefined) {
      return `€${options.val}`;
    }
    if (key === 'format.number' && options?.val !== undefined) {
      return String(options.val);
    }
    if (key === 'format.date' && options?.val !== undefined) {
      return new Date(options.val as Date).toLocaleDateString();
    }
    if (key === 'rowCount') {
      return `${options?.count} rows`;
    }
    return key;
  }) as TFunction;

  interface TestData {
    id: number;
    name: string;
    amount: number;
  }

  const mockData: TestData[] = [
    { id: 1, name: 'Item 1', amount: 100 },
    { id: 2, name: 'Item 2', amount: 200 },
    { id: 3, name: 'Item 3', amount: 300 },
  ];

  const defaultFields = [
    { name: 'name' as keyof TestData },
    { name: 'amount' as keyof TestData, format: 'currency' as const },
  ];

  it('renders table with data', () => {
    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
      />
    );

    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('amount')).toBeInTheDocument();
  });

  it('renders custom labels for columns', () => {
    const fieldsWithLabels = [
      { name: 'name' as keyof TestData, label: 'Product Name' },
      { name: 'amount' as keyof TestData, label: 'Price' },
    ];

    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={fieldsWithLabels}
        data={mockData}
      />
    );

    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('formats currency values', () => {
    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
      />
    );

    expect(screen.getByText('€100')).toBeInTheDocument();
    expect(screen.getByText('€200')).toBeInTheDocument();
  });

  it('shows no rows found message when data is empty', () => {
    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={[]}
      />
    );

    expect(screen.getByText('noRowsFound')).toBeInTheDocument();
  });

  it('renders add button when onNewRow is provided', () => {
    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
        onNewRow={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('calls onNewRow when add button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnNewRow = jest.fn();

    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
        onNewRow={mockOnNewRow}
      />
    );

    await user.click(screen.getByRole('button', { name: /add/i }));
    expect(mockOnNewRow).toHaveBeenCalled();
  });

  it('renders action buttons when onEdit is provided', () => {
    const { container } = renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
        onEdit={jest.fn()}
        onNewRow={jest.fn()}
      />
    );

    // IconButtons for edit are rendered (one per row)
    const iconButtons = container.querySelectorAll('.MuiIconButton-root');
    expect(iconButtons.length).toBe(mockData.length);
  });

  it('calls onEdit with correct id when action button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnEdit = jest.fn();

    const { container } = renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
        onEdit={mockOnEdit}
        onNewRow={jest.fn()}
      />
    );

    const iconButtons = container.querySelectorAll('.MuiIconButton-root');
    await user.click(iconButtons[0]);
    expect(mockOnEdit).toHaveBeenCalledWith(1);
  });

  it('renders checkboxes when onSelectChange is provided', () => {
    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
        onSelectChange={jest.fn()}
        selectedIds={[]}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(mockData.length + 1); // +1 for header checkbox
  });

  it('calls onSelectChange when row checkbox is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSelectChange = jest.fn();

    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
        onSelectChange={mockOnSelectChange}
        selectedIds={[]}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // Click first row checkbox (index 0 is header)
    expect(mockOnSelectChange).toHaveBeenCalledWith(1, mockData[0]);
  });

  it('shows sum when field has sum property', () => {
    const fieldsWithSum = [
      { name: 'name' as keyof TestData },
      { name: 'amount' as keyof TestData, format: 'currency' as const, sum: true },
    ];

    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={fieldsWithSum}
        data={mockData}
      />
    );

    // Total should be 100 + 200 + 300 = 600
    expect(screen.getByText('€600')).toBeInTheDocument();
  });

  it('shows row count when sum fields exist', () => {
    const fieldsWithSum = [
      { name: 'name' as keyof TestData },
      { name: 'amount' as keyof TestData, format: 'currency' as const, sum: true },
    ];

    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={fieldsWithSum}
        data={mockData}
      />
    );

    expect(screen.getByText('3 rows')).toBeInTheDocument();
  });

  it('truncates long text values with maxLength', () => {
    const longData = [
      { id: 1, name: 'This is a very long name that should be truncated', amount: 100 },
    ];

    const fieldsWithMaxLength = [
      { name: 'name' as keyof TestData, maxLength: 10 },
      { name: 'amount' as keyof TestData },
    ];

    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={fieldsWithMaxLength}
        data={longData}
      />
    );

    expect(screen.getByText('This is a ...')).toBeInTheDocument();
  });

  it('opens delete confirmation dialog when delete button is clicked', async () => {
    const user = userEvent.setup();

    const { container } = renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
        onDelete={jest.fn()}
        onNewRow={jest.fn()}
      />
    );

    // When onDelete is provided, the second icon button per row is delete
    const iconButtons = container.querySelectorAll('.MuiIconButton-root');
    await user.click(iconButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('confirmDelete')).toBeInTheDocument();
    });
  });

  it('calls onOpen when row is clicked and onOpen is provided', async () => {
    const user = userEvent.setup();
    const mockOnOpen = jest.fn();

    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
        onOpen={mockOnOpen}
      />
    );

    await user.click(screen.getByText('Item 1'));
    expect(mockOnOpen).toHaveBeenCalledWith(1);
  });

  it('handles select all checkbox', async () => {
    const user = userEvent.setup();
    const mockOnSelectAllChange = jest.fn();

    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
        onSelectChange={jest.fn()}
        onSelectAllChange={mockOnSelectAllChange}
        selectedIds={[]}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // Header checkbox
    expect(mockOnSelectAllChange).toHaveBeenCalledWith([1, 2, 3], mockData);
  });

  it('deselects all when all are selected and header checkbox is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSelectAllChange = jest.fn();

    renderWithProviders(
      <AlisaDataTable
        t={mockT}
        fields={defaultFields}
        data={mockData}
        onSelectChange={jest.fn()}
        onSelectAllChange={mockOnSelectAllChange}
        selectedIds={[1, 2, 3]}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // Header checkbox
    expect(mockOnSelectAllChange).toHaveBeenCalledWith([], []);
  });
});
