import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaDataTable from './AlisaDataTable';
import { TFunction } from 'i18next';

// Helper to mock window.matchMedia for mobile/desktop simulation
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('AlisaDataTable', () => {
  beforeEach(() => {
    // Default to desktop view (matchMedia returns false for mobile breakpoint)
    mockMatchMedia(false);
  });

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

  describe('custom render function', () => {
    it('uses render function when provided', () => {
      const fieldsWithRender = [
        { name: 'name' as keyof TestData },
        {
          name: 'amount' as keyof TestData,
          render: (item: TestData) => <span data-testid="custom-render">Custom: {item.amount}</span>,
        },
      ];

      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={fieldsWithRender}
          data={mockData}
        />
      );

      expect(screen.getAllByTestId('custom-render')).toHaveLength(3);
      expect(screen.getByText('Custom: 100')).toBeInTheDocument();
      expect(screen.getByText('Custom: 200')).toBeInTheDocument();
      expect(screen.getByText('Custom: 300')).toBeInTheDocument();
    });

    it('render function receives the full item', () => {
      const renderFn = jest.fn((item: TestData) => <span>{item.name} - {item.amount}</span>);
      const fieldsWithRender = [
        { name: 'name' as keyof TestData, render: renderFn },
      ];

      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={fieldsWithRender}
          data={mockData}
        />
      );

      expect(renderFn).toHaveBeenCalledTimes(3);
      expect(renderFn).toHaveBeenCalledWith(mockData[0], mockT);
      expect(renderFn).toHaveBeenCalledWith(mockData[1], mockT);
      expect(renderFn).toHaveBeenCalledWith(mockData[2], mockT);
    });
  });

  describe('sorting', () => {
    it('does not show sort controls when sortable is false (default)', () => {
      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={defaultFields}
          data={mockData}
        />
      );

      // No sort buttons should be present
      const sortButtons = screen.queryAllByRole('button', { name: /sort/i });
      expect(sortButtons.length).toBe(0);
    });

    it('shows sort controls when sortable is true', () => {
      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={defaultFields}
          data={mockData}
          sortable
        />
      );

      // Column headers should be clickable (TableSortLabel renders as button)
      expect(screen.getByText('name').closest('span')).toHaveClass('MuiTableSortLabel-root');
      expect(screen.getByText('amount').closest('span')).toHaveClass('MuiTableSortLabel-root');
    });

    it('sorts string data ascending when column header is clicked', async () => {
      const user = userEvent.setup();
      const unsortedData: TestData[] = [
        { id: 1, name: 'Charlie', amount: 100 },
        { id: 2, name: 'Alice', amount: 200 },
        { id: 3, name: 'Bob', amount: 300 },
      ];

      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={defaultFields}
          data={unsortedData}
          sortable
        />
      );

      // Click the name column header to sort
      await user.click(screen.getByText('name'));

      // Get all cells and check order
      const cells = screen.getAllByRole('cell');
      const nameValues = cells
        .map(cell => cell.textContent)
        .filter(text => ['Alice', 'Bob', 'Charlie'].includes(text || ''));

      expect(nameValues).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('sorts string data descending when column header is clicked twice', async () => {
      const user = userEvent.setup();
      const unsortedData: TestData[] = [
        { id: 1, name: 'Charlie', amount: 100 },
        { id: 2, name: 'Alice', amount: 200 },
        { id: 3, name: 'Bob', amount: 300 },
      ];

      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={defaultFields}
          data={unsortedData}
          sortable
        />
      );

      // Click the name column header twice to sort descending
      await user.click(screen.getByText('name'));
      await user.click(screen.getByText('name'));

      const cells = screen.getAllByRole('cell');
      const nameValues = cells
        .map(cell => cell.textContent)
        .filter(text => ['Alice', 'Bob', 'Charlie'].includes(text || ''));

      expect(nameValues).toEqual(['Charlie', 'Bob', 'Alice']);
    });

    it('sorts numeric data correctly', async () => {
      const user = userEvent.setup();
      const unsortedData: TestData[] = [
        { id: 1, name: 'Item 1', amount: 300 },
        { id: 2, name: 'Item 2', amount: 100 },
        { id: 3, name: 'Item 3', amount: 200 },
      ];

      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={defaultFields}
          data={unsortedData}
          sortable
        />
      );

      // Click the amount column header to sort
      await user.click(screen.getByText('amount'));

      const cells = screen.getAllByRole('cell');
      const amountValues = cells
        .map(cell => cell.textContent)
        .filter(text => text?.startsWith('€'));

      expect(amountValues).toEqual(['€100', '€200', '€300']);
    });

    it('sorts date data correctly', async () => {
      const user = userEvent.setup();

      interface DateTestData {
        id: number;
        date: string;
      }

      const dateData: DateTestData[] = [
        { id: 1, date: '2024-03-15' },
        { id: 2, date: '2024-01-10' },
        { id: 3, date: '2024-02-20' },
      ];

      const dateFields = [
        { name: 'date' as keyof DateTestData, format: 'date' as const },
      ];

      renderWithProviders(
        <AlisaDataTable<DateTestData>
          t={mockT}
          fields={dateFields}
          data={dateData}
          sortable
        />
      );

      // Click the date column header to sort ascending
      await user.click(screen.getByText('date'));

      // After sorting ascending, the first date should be January (earliest)
      // Note: Date format '1/10/2024' is locale-dependent (en-US format from renderWithProviders)
      const cells = screen.getAllByRole('cell');
      const firstDateCell = cells[0];
      expect(firstDateCell.textContent).toContain('1/10/2024');
    });
  });

  describe('mobile responsive columns', () => {
    interface ResponsiveTestData {
      id: number;
      name: string;
      description: string;
      amount: number;
    }

    const responsiveData: ResponsiveTestData[] = [
      { id: 1, name: 'Item 1', description: 'First item description', amount: 100 },
      { id: 2, name: 'Item 2', description: 'Second item description', amount: 200 },
    ];

    const responsiveFields = [
      { name: 'name' as keyof ResponsiveTestData },
      { name: 'description' as keyof ResponsiveTestData, hideOnMobile: true },
      { name: 'amount' as keyof ResponsiveTestData, format: 'currency' as const },
    ];

    it('shows all columns on desktop', () => {
      mockMatchMedia(false); // Desktop

      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={responsiveFields}
          data={responsiveData}
        />
      );

      // All column headers should be visible
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
      expect(screen.getByText('amount')).toBeInTheDocument();

      // All data should be visible
      expect(screen.getByText('First item description')).toBeInTheDocument();
      expect(screen.getByText('Second item description')).toBeInTheDocument();
    });

    it('hides columns with hideOnMobile on mobile', () => {
      mockMatchMedia(true); // Mobile

      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={responsiveFields}
          data={responsiveData}
        />
      );

      // Only visible column headers should be present
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.queryByText('description')).not.toBeInTheDocument();
      expect(screen.getByText('amount')).toBeInTheDocument();

      // Hidden column data should not be visible
      expect(screen.queryByText('First item description')).not.toBeInTheDocument();
      expect(screen.queryByText('Second item description')).not.toBeInTheDocument();

      // Visible column data should still be present
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('€100')).toBeInTheDocument();
    });

    it('sum calculations only include visible fields on mobile', () => {
      mockMatchMedia(true); // Mobile

      const fieldsWithSum = [
        { name: 'name' as keyof ResponsiveTestData },
        { name: 'description' as keyof ResponsiveTestData, hideOnMobile: true },
        { name: 'amount' as keyof ResponsiveTestData, format: 'currency' as const, sum: true, hideOnMobile: true },
      ];

      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={fieldsWithSum}
          data={responsiveData}
        />
      );

      // Sum should not be displayed because the sum field is hidden on mobile
      expect(screen.queryByText('€300')).not.toBeInTheDocument();
      expect(screen.queryByText('totalAmount')).not.toBeInTheDocument();
    });

    it('sum calculations show for visible sum fields on mobile', () => {
      mockMatchMedia(true); // Mobile

      const fieldsWithVisibleSum = [
        { name: 'name' as keyof ResponsiveTestData },
        { name: 'description' as keyof ResponsiveTestData, hideOnMobile: true },
        { name: 'amount' as keyof ResponsiveTestData, format: 'currency' as const, sum: true },
      ];

      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={fieldsWithVisibleSum}
          data={responsiveData}
        />
      );

      // Sum should be displayed because the sum field is visible on mobile
      expect(screen.getByText('€300')).toBeInTheDocument();
    });

    it('shows all columns when hideOnMobile is false', () => {
      mockMatchMedia(true); // Mobile

      const fieldsWithExplicitFalse = [
        { name: 'name' as keyof ResponsiveTestData },
        { name: 'description' as keyof ResponsiveTestData, hideOnMobile: false },
        { name: 'amount' as keyof ResponsiveTestData, format: 'currency' as const },
      ];

      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={fieldsWithExplicitFalse}
          data={responsiveData}
        />
      );

      // All columns should be visible
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
      expect(screen.getByText('amount')).toBeInTheDocument();
    });

    it('shows action menu on mobile instead of individual buttons', async () => {
      const user = userEvent.setup();
      mockMatchMedia(true); // Mobile

      const mockOnEdit = jest.fn();

      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={responsiveFields}
          data={responsiveData}
          onEdit={mockOnEdit}
          onNewRow={jest.fn()}
        />
      );

      // Should show menu button instead of individual action buttons
      const menuButtons = screen.getAllByLabelText('actions');
      expect(menuButtons.length).toBe(responsiveData.length);

      // Click the menu button to open menu
      await user.click(menuButtons[0]);

      // Menu should show edit option
      expect(screen.getByText('edit')).toBeInTheDocument();
    });

    it('shows individual action buttons on desktop', () => {
      mockMatchMedia(false); // Desktop

      const { container } = renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={responsiveFields}
          data={responsiveData}
          onEdit={jest.fn()}
          onNewRow={jest.fn()}
        />
      );

      // Should show individual icon buttons, not menu buttons
      const iconButtons = container.querySelectorAll('.MuiIconButton-root');
      expect(iconButtons.length).toBe(responsiveData.length);

      // Should NOT show menu buttons
      expect(screen.queryByLabelText('actions')).not.toBeInTheDocument();
    });

    it('mobile action menu calls onEdit when edit is clicked', async () => {
      const user = userEvent.setup();
      mockMatchMedia(true); // Mobile

      const mockOnEdit = jest.fn();

      renderWithProviders(
        <AlisaDataTable
          t={mockT}
          fields={responsiveFields}
          data={responsiveData}
          onEdit={mockOnEdit}
          onNewRow={jest.fn()}
        />
      );

      // Open menu for first row
      const menuButtons = screen.getAllByLabelText('actions');
      await user.click(menuButtons[0]);

      // Click edit in menu
      await user.click(screen.getByText('edit'));

      expect(mockOnEdit).toHaveBeenCalledWith(1);
    });
  });
});
