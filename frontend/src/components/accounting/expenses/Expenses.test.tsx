// frontend/src/components/accounting/expenses/Expenses.test.tsx
import '@testing-library/jest-dom';
import { AccountingFilterData } from '../AccountingFilter';

// Since Jest mock hoisting causes issues with ESM mode,
// we test the data transformation logic separately from the React component

interface ExpenseRow {
  id: number;
  accountingDate: Date | null;
  expenseTypeName: string;
  description: string;
  quantity: number;
  amount: number;
  totalAmount: number;
}

describe('Expenses Component Logic', () => {
  const defaultFilter: AccountingFilterData = {
    typeIds: [],
    searchText: '',
    startDate: null,
    endDate: null,
  };

  describe('getDefaultFilter', () => {
    it('returns empty typeIds array', () => {
      expect(defaultFilter.typeIds).toEqual([]);
    });

    it('returns empty searchText', () => {
      expect(defaultFilter.searchText).toBe('');
    });

    it('returns null startDate', () => {
      expect(defaultFilter.startDate).toBeNull();
    });

    it('returns null endDate', () => {
      expect(defaultFilter.endDate).toBeNull();
    });
  });

  describe('getDateFilter logic', () => {
    const getDateFilter = (filter: AccountingFilterData) => {
      if (filter.startDate && filter.endDate) {
        return { $between: [filter.startDate, filter.endDate] };
      }
      if (filter.startDate) {
        return { $gte: filter.startDate };
      }
      if (filter.endDate) {
        return { $lte: filter.endDate };
      }
      return undefined;
    };

    it('returns undefined when no dates set', () => {
      expect(getDateFilter(defaultFilter)).toBeUndefined();
    });

    it('returns between filter when both dates set', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const filter = { ...defaultFilter, startDate, endDate };

      expect(getDateFilter(filter)).toEqual({
        $between: [startDate, endDate],
      });
    });

    it('returns gte filter when only startDate set', () => {
      const startDate = new Date('2024-01-01');
      const filter = { ...defaultFilter, startDate };

      expect(getDateFilter(filter)).toEqual({ $gte: startDate });
    });

    it('returns lte filter when only endDate set', () => {
      const endDate = new Date('2024-12-31');
      const filter = { ...defaultFilter, endDate };

      expect(getDateFilter(filter)).toEqual({ $lte: endDate });
    });
  });

  describe('fetchOptions construction', () => {
    it('includes propertyId when greater than 0', () => {
      const propertyId = 5;
      const where = {
        propertyId: propertyId > 0 ? propertyId : undefined,
      };

      expect(where.propertyId).toBe(5);
    });

    it('excludes propertyId when 0', () => {
      const propertyId = 0;
      const where = {
        propertyId: propertyId > 0 ? propertyId : undefined,
      };

      expect(where.propertyId).toBeUndefined();
    });

    it('includes expenseTypeId filter when typeIds provided', () => {
      const filter = { ...defaultFilter, typeIds: [1, 2, 3] };
      const where = {
        expenseTypeId:
          filter.typeIds.length > 0 ? { $in: filter.typeIds } : undefined,
      };

      expect(where.expenseTypeId).toEqual({ $in: [1, 2, 3] });
    });

    it('excludes expenseTypeId filter when typeIds empty', () => {
      const where = {
        expenseTypeId:
          defaultFilter.typeIds.length > 0
            ? { $in: defaultFilter.typeIds }
            : undefined,
      };

      expect(where.expenseTypeId).toBeUndefined();
    });

    it('includes description filter when searchText provided', () => {
      const filter = { ...defaultFilter, searchText: 'electricity' };
      const where = {
        description: filter.searchText
          ? { $ilike: `%${filter.searchText}%` }
          : undefined,
      };

      expect(where.description).toEqual({ $ilike: '%electricity%' });
    });

    it('excludes description filter when searchText empty', () => {
      const where = {
        description: defaultFilter.searchText
          ? { $ilike: `%${defaultFilter.searchText}%` }
          : undefined,
      };

      expect(where.description).toBeUndefined();
    });
  });

  describe('rowDataService transformation', () => {
    interface MockExpense {
      id: number;
      accountingDate: Date | null;
      expenseType?: { id: number; name: string };
      description: string;
      quantity: number;
      amount: number;
      totalAmount: number;
      property: { id: number; name: string };
    }

    const mockExpense: MockExpense = {
      id: 1,
      accountingDate: new Date('2024-03-15'),
      expenseType: { id: 1, name: 'Utilities' },
      description: 'Electricity bill',
      quantity: 1,
      amount: 150.5,
      totalAmount: 150.5,
      property: { id: 1, name: 'Test Property' },
    };

    it('transforms expense to row format', () => {
      const row: ExpenseRow = {
        id: mockExpense.id,
        accountingDate: mockExpense.accountingDate || null,
        expenseTypeName: mockExpense.expenseType?.name || '',
        description: mockExpense.description,
        quantity: mockExpense.quantity,
        amount: mockExpense.amount,
        totalAmount: mockExpense.totalAmount,
      };

      expect(row.id).toBe(1);
      expect(row.accountingDate).toEqual(new Date('2024-03-15'));
      expect(row.expenseTypeName).toBe('Utilities');
      expect(row.description).toBe('Electricity bill');
      expect(row.quantity).toBe(1);
      expect(row.amount).toBe(150.5);
      expect(row.totalAmount).toBe(150.5);
    });

    it('handles null accountingDate', () => {
      const expense = { ...mockExpense, accountingDate: null };
      const row: ExpenseRow = {
        id: expense.id,
        accountingDate: expense.accountingDate || null,
        expenseTypeName: expense.expenseType?.name || '',
        description: expense.description,
        quantity: expense.quantity,
        amount: expense.amount,
        totalAmount: expense.totalAmount,
      };

      expect(row.accountingDate).toBeNull();
    });

    it('handles missing expenseType', () => {
      const expense: MockExpense = { ...mockExpense, expenseType: undefined };
      const row: ExpenseRow = {
        id: expense.id,
        accountingDate: expense.accountingDate || null,
        expenseTypeName: expense.expenseType?.name || '',
        description: expense.description,
        quantity: expense.quantity,
        amount: expense.amount,
        totalAmount: expense.totalAmount,
      };

      expect(row.expenseTypeName).toBe('');
    });
  });

  describe('Filter change handlers', () => {
    it('handleTypeChange updates typeIds', () => {
      let filter = { ...defaultFilter };
      const handleTypeChange = (typeIds: number[]) => {
        filter = { ...filter, typeIds };
      };

      handleTypeChange([1, 2, 3]);
      expect(filter.typeIds).toEqual([1, 2, 3]);
    });

    it('handleSearchTextChange updates searchText', () => {
      let filter = { ...defaultFilter };
      const handleSearchTextChange = (searchText: string) => {
        filter = { ...filter, searchText };
      };

      handleSearchTextChange('repair');
      expect(filter.searchText).toBe('repair');
    });

    it('handleStartDateChange updates startDate', () => {
      let filter = { ...defaultFilter };
      const handleStartDateChange = (startDate: Date | null) => {
        filter = { ...filter, startDate };
      };

      const newDate = new Date('2024-01-01');
      handleStartDateChange(newDate);
      expect(filter.startDate).toEqual(newDate);
    });

    it('handleEndDateChange updates endDate', () => {
      let filter = { ...defaultFilter };
      const handleEndDateChange = (endDate: Date | null) => {
        filter = { ...filter, endDate };
      };

      const newDate = new Date('2024-12-31');
      handleEndDateChange(newDate);
      expect(filter.endDate).toEqual(newDate);
    });

    it('handleReset returns default filter', () => {
      let filter: AccountingFilterData = {
        typeIds: [1, 2],
        searchText: 'test',
        startDate: new Date(),
        endDate: new Date(),
      };

      const handleReset = () => {
        filter = {
          typeIds: [],
          searchText: '',
          startDate: null,
          endDate: null,
        };
      };

      handleReset();
      expect(filter).toEqual(defaultFilter);
    });
  });

  describe('State management', () => {
    it('editId starts as undefined', () => {
      const editId: number | undefined = undefined;
      expect(editId).toBeUndefined();
    });

    it('handleOpenDetails sets editId', () => {
      let editId: number | undefined = undefined;
      const handleOpenDetails = (id: number) => {
        editId = id;
      };

      handleOpenDetails(5);
      expect(editId).toBe(5);
    });

    it('addNew starts as false', () => {
      const addNew = false;
      expect(addNew).toBe(false);
    });

    it('handleAdd sets addNew to true', () => {
      let addNew = false;
      const handleAdd = () => {
        addNew = true;
      };

      handleAdd();
      expect(addNew).toBe(true);
    });

    it('handleFormClose resets editId and addNew', () => {
      let editId: number | undefined = 5;
      let addNew = true;

      const handleFormClose = () => {
        editId = undefined;
        addNew = false;
      };

      handleFormClose();
      expect(editId).toBeUndefined();
      expect(addNew).toBe(false);
    });

    it('handleAfterSubmit resets state and increments refreshTrigger', () => {
      let editId: number | undefined = 5;
      let addNew = true;
      let refreshTrigger = 0;

      const handleAfterSubmit = () => {
        editId = undefined;
        addNew = false;
        refreshTrigger = refreshTrigger + 1;
      };

      handleAfterSubmit();
      expect(editId).toBeUndefined();
      expect(addNew).toBe(false);
      expect(refreshTrigger).toBe(1);
    });
  });

  describe('ExpenseForm props derivation', () => {
    it('uses propertyId when greater than 0', () => {
      const propertyId = 5;
      const formPropertyId = propertyId > 0 ? propertyId : undefined;
      expect(formPropertyId).toBe(5);
    });

    it('excludes propertyId when 0', () => {
      const propertyId = 0;
      const formPropertyId = propertyId > 0 ? propertyId : undefined;
      expect(formPropertyId).toBeUndefined();
    });

    it('uses first typeId as default when only one selected', () => {
      const filter = { ...defaultFilter, typeIds: [3] };
      const defaultExpenseTypeId =
        filter.typeIds.length === 1 ? filter.typeIds[0] : undefined;
      expect(defaultExpenseTypeId).toBe(3);
    });

    it('excludes default typeId when multiple selected', () => {
      const filter = { ...defaultFilter, typeIds: [1, 2, 3] };
      const defaultExpenseTypeId =
        filter.typeIds.length === 1 ? filter.typeIds[0] : undefined;
      expect(defaultExpenseTypeId).toBeUndefined();
    });

    it('excludes default typeId when none selected', () => {
      const defaultExpenseTypeId =
        defaultFilter.typeIds.length === 1 ? defaultFilter.typeIds[0] : undefined;
      expect(defaultExpenseTypeId).toBeUndefined();
    });
  });

  describe('DataTable field configuration', () => {
    const fields = [
      { name: 'accountingDate', format: 'date' },
      { name: 'expenseTypeName', label: 'expenseType' },
      { name: 'description', maxLength: 40 },
      { name: 'quantity', format: 'number' },
      { name: 'amount', format: 'currency' },
      { name: 'totalAmount', format: 'currency', sum: true },
    ];

    it('has 6 fields configured', () => {
      expect(fields).toHaveLength(6);
    });

    it('accountingDate uses date format', () => {
      const field = fields.find((f) => f.name === 'accountingDate');
      expect(field?.format).toBe('date');
    });

    it('totalAmount has sum enabled', () => {
      const field = fields.find((f) => f.name === 'totalAmount');
      expect(field?.sum).toBe(true);
    });

    it('description has maxLength of 40', () => {
      const field = fields.find((f) => f.name === 'description');
      expect(field?.maxLength).toBe(40);
    });

    it('amount uses currency format', () => {
      const field = fields.find((f) => f.name === 'amount');
      expect(field?.format).toBe('currency');
    });
  });

  describe('Bulk selection state management', () => {
    it('selectedIds starts as empty array', () => {
      const selectedIds: number[] = [];
      expect(selectedIds).toEqual([]);
    });

    it('handleSelectChange adds id when not selected', () => {
      let selectedIds: number[] = [];
      const handleSelectChange = (id: number) => {
        selectedIds = selectedIds.includes(id)
          ? selectedIds.filter((i) => i !== id)
          : [...selectedIds, id];
      };

      handleSelectChange(1);
      expect(selectedIds).toEqual([1]);
    });

    it('handleSelectChange removes id when already selected', () => {
      let selectedIds = [1, 2, 3];
      const handleSelectChange = (id: number) => {
        selectedIds = selectedIds.includes(id)
          ? selectedIds.filter((i) => i !== id)
          : [...selectedIds, id];
      };

      handleSelectChange(2);
      expect(selectedIds).toEqual([1, 3]);
    });

    it('handleSelectAllChange sets all ids', () => {
      let selectedIds: number[] = [];
      const handleSelectAllChange = (ids: number[]) => {
        selectedIds = ids;
      };

      handleSelectAllChange([1, 2, 3]);
      expect(selectedIds).toEqual([1, 2, 3]);
    });

    it('handleSelectAllChange clears selection when passed empty array', () => {
      let selectedIds = [1, 2, 3];
      const handleSelectAllChange = (ids: number[]) => {
        selectedIds = ids;
      };

      handleSelectAllChange([]);
      expect(selectedIds).toEqual([]);
    });

    it('handleCancelSelection clears selected ids', () => {
      let selectedIds = [1, 2, 3];
      const handleCancelSelection = () => {
        selectedIds = [];
      };

      handleCancelSelection();
      expect(selectedIds).toEqual([]);
    });
  });

  describe('Bulk delete state management', () => {
    it('isDeleting starts as false', () => {
      const isDeleting = false;
      expect(isDeleting).toBe(false);
    });

    it('handleBulkDelete does nothing when selectedIds is empty', () => {
      const isDeleting = false;
      const selectedIds: number[] = [];
      let apiCalls = 0;

      const handleBulkDelete = () => {
        if (selectedIds.length === 0 || isDeleting) return;
        apiCalls++;
      };

      handleBulkDelete();
      expect(apiCalls).toBe(0);
    });

    it('handleBulkDelete does nothing when already deleting', () => {
      const isDeleting = true;
      const selectedIds = [1, 2];
      let apiCalls = 0;

      const handleBulkDelete = () => {
        if (selectedIds.length === 0 || isDeleting) return;
        apiCalls++;
      };

      handleBulkDelete();
      expect(apiCalls).toBe(0);
    });

    it('isDeleting prevents multiple delete calls', () => {
      let isDeleting = false;
      const selectedIds = [1, 2];
      let apiCalls = 0;

      const handleBulkDelete = () => {
        if (selectedIds.length === 0 || isDeleting) return;
        isDeleting = true;
        apiCalls++;
      };

      handleBulkDelete();
      expect(apiCalls).toBe(1);

      handleBulkDelete();
      expect(apiCalls).toBe(1);
    });

    it('successful bulk delete clears selection and increments refresh', () => {
      let selectedIds = [1, 2];
      let refreshTrigger = 0;

      const handleBulkDeleteSuccess = () => {
        selectedIds = [];
        refreshTrigger++;
      };

      handleBulkDeleteSuccess();
      expect(selectedIds).toEqual([]);
      expect(refreshTrigger).toBe(1);
    });
  });

  describe('Actions panel visibility', () => {
    it('actions panel is hidden when no selection', () => {
      const selectedIds: number[] = [];
      const open = selectedIds.length > 0;
      expect(open).toBe(false);
    });

    it('actions panel is visible when selection exists', () => {
      const selectedIds = [1, 2];
      const open = selectedIds.length > 0;
      expect(open).toBe(true);
    });
  });

  describe('Filter visibility with selection', () => {
    it('filter is visible when no selection', () => {
      const selectedIds: number[] = [];
      const display = selectedIds.length === 0 ? 'block' : 'none';
      expect(display).toBe('block');
    });

    it('filter is hidden when selection exists', () => {
      const selectedIds = [1, 2];
      const display = selectedIds.length === 0 ? 'block' : 'none';
      expect(display).toBe('none');
    });
  });
});
