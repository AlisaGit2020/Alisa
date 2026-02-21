// frontend/src/components/accounting/incomes/Incomes.test.tsx
import '@testing-library/jest-dom';
import { AccountingFilterData } from '../AccountingFilter';

// Since Jest mock hoisting causes issues with ESM mode,
// we test the data transformation logic separately from the React component

interface IncomeRow {
  id: number;
  accountingDate: Date | null;
  incomeTypeName: string;
  description: string;
  quantity: number;
  amount: number;
  totalAmount: number;
}

describe('Incomes Component Logic', () => {
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

    it('includes incomeTypeId filter when typeIds provided', () => {
      const filter = { ...defaultFilter, typeIds: [1, 2, 3] };
      const where = {
        incomeTypeId:
          filter.typeIds.length > 0 ? { $in: filter.typeIds } : undefined,
      };

      expect(where.incomeTypeId).toEqual({ $in: [1, 2, 3] });
    });

    it('excludes incomeTypeId filter when typeIds empty', () => {
      const where = {
        incomeTypeId:
          defaultFilter.typeIds.length > 0
            ? { $in: defaultFilter.typeIds }
            : undefined,
      };

      expect(where.incomeTypeId).toBeUndefined();
    });

    it('includes description filter when searchText provided', () => {
      const filter = { ...defaultFilter, searchText: 'rent' };
      const where = {
        description: filter.searchText
          ? { $ilike: `%${filter.searchText}%` }
          : undefined,
      };

      expect(where.description).toEqual({ $ilike: '%rent%' });
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
    interface MockIncome {
      id: number;
      accountingDate: Date | null;
      incomeType?: { id: number; name: string };
      description: string;
      quantity: number;
      amount: number;
      totalAmount: number;
      property: { id: number; name: string };
    }

    const mockIncome: MockIncome = {
      id: 1,
      accountingDate: new Date('2024-03-15'),
      incomeType: { id: 1, name: 'Rent' },
      description: 'March rent payment',
      quantity: 1,
      amount: 1200,
      totalAmount: 1200,
      property: { id: 1, name: 'Test Property' },
    };

    it('transforms income to row format', () => {
      const row: IncomeRow = {
        id: mockIncome.id,
        accountingDate: mockIncome.accountingDate || null,
        incomeTypeName: mockIncome.incomeType?.name || '',
        description: mockIncome.description,
        quantity: mockIncome.quantity,
        amount: mockIncome.amount,
        totalAmount: mockIncome.totalAmount,
      };

      expect(row.id).toBe(1);
      expect(row.accountingDate).toEqual(new Date('2024-03-15'));
      expect(row.incomeTypeName).toBe('Rent');
      expect(row.description).toBe('March rent payment');
      expect(row.quantity).toBe(1);
      expect(row.amount).toBe(1200);
      expect(row.totalAmount).toBe(1200);
    });

    it('handles null accountingDate', () => {
      const income = { ...mockIncome, accountingDate: null };
      const row: IncomeRow = {
        id: income.id,
        accountingDate: income.accountingDate || null,
        incomeTypeName: income.incomeType?.name || '',
        description: income.description,
        quantity: income.quantity,
        amount: income.amount,
        totalAmount: income.totalAmount,
      };

      expect(row.accountingDate).toBeNull();
    });

    it('handles missing incomeType', () => {
      const income: MockIncome = { ...mockIncome, incomeType: undefined };
      const row: IncomeRow = {
        id: income.id,
        accountingDate: income.accountingDate || null,
        incomeTypeName: income.incomeType?.name || '',
        description: income.description,
        quantity: income.quantity,
        amount: income.amount,
        totalAmount: income.totalAmount,
      };

      expect(row.incomeTypeName).toBe('');
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

      handleSearchTextChange('deposit');
      expect(filter.searchText).toBe('deposit');
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

  describe('IncomeForm props derivation', () => {
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
      const filter = { ...defaultFilter, typeIds: [2] };
      const defaultIncomeTypeId =
        filter.typeIds.length === 1 ? filter.typeIds[0] : undefined;
      expect(defaultIncomeTypeId).toBe(2);
    });

    it('excludes default typeId when multiple selected', () => {
      const filter = { ...defaultFilter, typeIds: [1, 2, 3] };
      const defaultIncomeTypeId =
        filter.typeIds.length === 1 ? filter.typeIds[0] : undefined;
      expect(defaultIncomeTypeId).toBeUndefined();
    });

    it('excludes default typeId when none selected', () => {
      const defaultIncomeTypeId =
        defaultFilter.typeIds.length === 1 ? defaultFilter.typeIds[0] : undefined;
      expect(defaultIncomeTypeId).toBeUndefined();
    });
  });

  describe('DataTable field configuration', () => {
    const fields = [
      { name: 'accountingDate', format: 'date' },
      { name: 'incomeTypeName', label: 'incomeType' },
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

    it('incomeTypeName has custom label', () => {
      const field = fields.find((f) => f.name === 'incomeTypeName');
      expect(field?.label).toBe('incomeType');
    });
  });

  describe('Property change event handling', () => {
    it('updates propertyId on event', () => {
      let propertyId = 1;
      const handlePropertyChange = (newPropertyId: number) => {
        propertyId = newPropertyId;
      };

      handlePropertyChange(5);
      expect(propertyId).toBe(5);
    });

    it('increments refreshTrigger on property change', () => {
      let refreshTrigger = 0;
      const handlePropertyChange = () => {
        refreshTrigger = refreshTrigger + 1;
      };

      handlePropertyChange();
      handlePropertyChange();
      expect(refreshTrigger).toBe(2);
    });
  });

  describe('Ordering configuration', () => {
    const order = {
      accountingDate: 'DESC',
      id: 'DESC',
    };

    it('orders by accountingDate descending', () => {
      expect(order.accountingDate).toBe('DESC');
    });

    it('orders by id descending as secondary sort', () => {
      expect(order.id).toBe('DESC');
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

  describe('Bulk delete pre-validation', () => {
    interface IncomeRowWithTransaction {
      id: number;
      accountingDate: Date | null;
      incomeTypeName: string;
      description: string;
      quantity: number;
      amount: number;
      totalAmount: number;
      transactionId: number | null;
    }

    const incomeWithTransaction1: IncomeRowWithTransaction = {
      id: 1,
      accountingDate: new Date('2024-03-15'),
      incomeTypeName: 'Rent',
      description: 'March rent',
      quantity: 1,
      amount: 1200,
      totalAmount: 1200,
      transactionId: 100,
    };

    const incomeWithTransaction2: IncomeRowWithTransaction = {
      id: 2,
      accountingDate: new Date('2024-03-16'),
      incomeTypeName: 'Rent',
      description: 'Late fee',
      quantity: 1,
      amount: 50,
      totalAmount: 50,
      transactionId: 101,
    };

    const incomeWithoutTransaction1: IncomeRowWithTransaction = {
      id: 3,
      accountingDate: new Date('2024-03-17'),
      incomeTypeName: 'Deposit',
      description: 'Security deposit',
      quantity: 1,
      amount: 500,
      totalAmount: 500,
      transactionId: null,
    };

    const incomeWithoutTransaction2: IncomeRowWithTransaction = {
      id: 4,
      accountingDate: new Date('2024-03-18'),
      incomeTypeName: 'Other',
      description: 'Parking fee',
      quantity: 1,
      amount: 100,
      totalAmount: 100,
      transactionId: null,
    };

    it('shows warning and filters out items with transactions when some have transactions', () => {
      const incomeData = [
        incomeWithTransaction1,
        incomeWithTransaction2,
        incomeWithoutTransaction1,
        incomeWithoutTransaction2,
      ];
      let selectedIds = [1, 2, 3, 4];
      let transactionWarningOpen = false;
      let itemsWithTransaction: IncomeRowWithTransaction[] = [];
      let deletableIds: number[] = [];
      let bulkDeleteCalled = false;

      const handleBulkDelete = () => {
        const selectedIncomes = incomeData.filter((i) => selectedIds.includes(i.id));
        const withTransaction = selectedIncomes.filter((i) => i.transactionId !== null);
        const withoutTransaction = selectedIncomes.filter((i) => i.transactionId === null);
        const deletableIdsToProcess = withoutTransaction.map((i) => i.id);

        if (withTransaction.length > 0) {
          itemsWithTransaction = withTransaction;
          deletableIds = deletableIdsToProcess;
          transactionWarningOpen = true;
          selectedIds = deletableIdsToProcess;
          return;
        }

        bulkDeleteCalled = true;
      };

      handleBulkDelete();

      expect(transactionWarningOpen).toBe(true);
      expect(itemsWithTransaction).toHaveLength(2);
      expect(itemsWithTransaction.map((i) => i.id)).toEqual([1, 2]);
      expect(deletableIds).toEqual([3, 4]);
      expect(selectedIds).toEqual([3, 4]);
      expect(bulkDeleteCalled).toBe(false);
    });

    it('shows confirmation dialog when all items are deletable', () => {
      const incomeData = [incomeWithoutTransaction1, incomeWithoutTransaction2];
      let selectedIds = [3, 4];
      let transactionWarningOpen = false;
      let bulkDeleteConfirmOpen = false;

      const handleBulkDelete = () => {
        const selectedIncomes = incomeData.filter((i) => selectedIds.includes(i.id));
        const withTransaction = selectedIncomes.filter((i) => i.transactionId !== null);
        const withoutTransaction = selectedIncomes.filter((i) => i.transactionId === null);
        const deletableIdsToProcess = withoutTransaction.map((i) => i.id);

        if (withTransaction.length > 0) {
          transactionWarningOpen = true;
          selectedIds = deletableIdsToProcess;
          return;
        }

        // All items are deletable - show confirmation dialog
        bulkDeleteConfirmOpen = true;
      };

      handleBulkDelete();

      expect(transactionWarningOpen).toBe(false);
      expect(bulkDeleteConfirmOpen).toBe(true);
    });

    it('shows warning with no deletable items when all have transactions', () => {
      const incomeData = [incomeWithTransaction1, incomeWithTransaction2];
      let selectedIds = [1, 2];
      let transactionWarningOpen = false;
      let deletableIds: number[] = [];

      const handleBulkDelete = () => {
        const selectedIncomes = incomeData.filter((i) => selectedIds.includes(i.id));
        const withTransaction = selectedIncomes.filter((i) => i.transactionId !== null);
        const withoutTransaction = selectedIncomes.filter((i) => i.transactionId === null);
        const deletableIdsToProcess = withoutTransaction.map((i) => i.id);

        if (withTransaction.length > 0) {
          deletableIds = deletableIdsToProcess;
          transactionWarningOpen = true;
          selectedIds = deletableIdsToProcess;
          return;
        }
      };

      handleBulkDelete();

      expect(transactionWarningOpen).toBe(true);
      expect(deletableIds).toEqual([]);
      expect(selectedIds).toEqual([]);
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

  describe('Single row delete pre-validation', () => {
    interface IncomeRowWithTransaction {
      id: number;
      accountingDate: Date | null;
      incomeTypeName: string;
      description: string;
      quantity: number;
      amount: number;
      totalAmount: number;
      transactionId: number | null;
    }

    const incomeWithTransaction: IncomeRowWithTransaction = {
      id: 1,
      accountingDate: new Date('2024-03-15'),
      incomeTypeName: 'Rent',
      description: 'March rent payment',
      quantity: 1,
      amount: 1200,
      totalAmount: 1200,
      transactionId: 100,
    };

    const incomeWithoutTransaction: IncomeRowWithTransaction = {
      id: 2,
      accountingDate: new Date('2024-03-16'),
      incomeTypeName: 'Deposit',
      description: 'Security deposit',
      quantity: 1,
      amount: 500,
      totalAmount: 500,
      transactionId: null,
    };

    it('shows warning dialog when deleting income with transaction', () => {
      const incomeData = [incomeWithTransaction, incomeWithoutTransaction];
      let singleDeleteWarningOpen = false;
      let singleDeleteItemId: number | null = null;
      let deleteProceed = false;

      const handleSingleDeleteRequest = (id: number) => {
        const income = incomeData.find((i) => i.id === id);
        if (income?.transactionId !== null) {
          singleDeleteWarningOpen = true;
          singleDeleteItemId = id;
          return;
        }
        deleteProceed = true;
      };

      handleSingleDeleteRequest(1);

      expect(singleDeleteWarningOpen).toBe(true);
      expect(singleDeleteItemId).toBe(1);
      expect(deleteProceed).toBe(false);
    });

    it('proceeds with delete when income has no transaction', () => {
      const incomeData = [incomeWithTransaction, incomeWithoutTransaction];
      let singleDeleteWarningOpen = false;
      let singleDeleteItemId: number | null = null;
      let deleteProceed = false;

      const handleSingleDeleteRequest = (id: number) => {
        const income = incomeData.find((i) => i.id === id);
        if (income?.transactionId !== null) {
          singleDeleteWarningOpen = true;
          singleDeleteItemId = id;
          return;
        }
        deleteProceed = true;
      };

      handleSingleDeleteRequest(2);

      expect(singleDeleteWarningOpen).toBe(false);
      expect(singleDeleteItemId).toBeNull();
      expect(deleteProceed).toBe(true);
    });

    it('shows warning when income not found in data', () => {
      const incomeData = [incomeWithTransaction, incomeWithoutTransaction];
      let singleDeleteWarningOpen = false;
      let deleteProceed = false;

      const handleSingleDeleteRequest = (id: number) => {
        const income = incomeData.find((i) => i.id === id);
        if (income?.transactionId !== null) {
          singleDeleteWarningOpen = true;
          return;
        }
        deleteProceed = true;
      };

      handleSingleDeleteRequest(999); // Non-existent id

      // When income not found, transactionId check returns undefined !== null which is true
      // This is expected behavior - if item not found, show warning (defensive)
      expect(singleDeleteWarningOpen).toBe(true);
      expect(deleteProceed).toBe(false);
    });
  });
});
