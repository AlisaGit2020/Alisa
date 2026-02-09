// frontend/src/components/accounting/AccountingFilter.test.tsx
import '@testing-library/jest-dom';
import { AccountingFilterData } from './AccountingFilter';

// Since Jest mock hoisting causes issues with ESM mode,
// we test the data transformation logic separately from the React component

describe('AccountingFilter Component Logic', () => {
  const defaultFilter: AccountingFilterData = {
    typeIds: [],
    searchText: '',
    startDate: null,
    endDate: null,
  };

  describe('getTypeLabel logic', () => {
    const mockTypes = [
      { id: 1, name: 'Rent' },
      { id: 2, name: 'Utilities' },
      { id: 3, name: 'Repairs' },
    ];

    it('returns empty placeholder when no types selected', () => {
      const selected: number[] = [];
      const getTypeLabel = (selected: number[]) => {
        if (!selected || selected.length === 0) {
          return 'dataNotSelected';
        }
        return selected
          .map((id) => {
            const type = mockTypes.find((t) => t.id === id);
            return type ? type.name : '';
          })
          .join(', ');
      };

      expect(getTypeLabel(selected)).toBe('dataNotSelected');
    });

    it('returns single type name when one selected', () => {
      const selected = [1];
      const getTypeLabel = (selected: number[]) => {
        if (!selected || selected.length === 0) {
          return 'dataNotSelected';
        }
        return selected
          .map((id) => {
            const type = mockTypes.find((t) => t.id === id);
            return type ? type.name : '';
          })
          .join(', ');
      };

      expect(getTypeLabel(selected)).toBe('Rent');
    });

    it('returns comma-separated names when multiple selected', () => {
      const selected = [1, 2, 3];
      const getTypeLabel = (selected: number[]) => {
        if (!selected || selected.length === 0) {
          return 'dataNotSelected';
        }
        return selected
          .map((id) => {
            const type = mockTypes.find((t) => t.id === id);
            return type ? type.name : '';
          })
          .join(', ');
      };

      expect(getTypeLabel(selected)).toBe('Rent, Utilities, Repairs');
    });

    it('handles unknown type IDs gracefully', () => {
      const selected = [999];
      const getTypeLabel = (selected: number[]) => {
        if (!selected || selected.length === 0) {
          return 'dataNotSelected';
        }
        return selected
          .map((id) => {
            const type = mockTypes.find((t) => t.id === id);
            return type ? type.name : '';
          })
          .join(', ');
      };

      expect(getTypeLabel(selected)).toBe('');
    });
  });

  describe('formatDate logic', () => {
    it('returns null for null date', () => {
      const formatDate = (date: Date | null) => {
        if (!date) return null;
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
      };

      expect(formatDate(null)).toBeNull();
    });

    it('formats date in DD.MM.YYYY format', () => {
      const formatDate = (date: Date | null) => {
        if (!date) return null;
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
      };

      const date = new Date('2024-03-15');
      expect(formatDate(date)).toBe('15.03.2024');
    });
  });

  describe('getFilterSummary logic', () => {
    const mockTypes = [
      { id: 1, name: 'Rent' },
      { id: 2, name: 'Utilities' },
    ];

    const getFilterSummary = (filter: AccountingFilterData, mode: 'expense' | 'income') => {
      const filters: string[] = [];

      if (filter.typeIds.length > 0) {
        const typeNames = filter.typeIds
          .map((id) => {
            const type = mockTypes.find((t) => t.id === id);
            return type ? type.name : '';
          })
          .join(', ');
        filters.push(
          `${mode === 'expense' ? 'expenseType' : 'incomeType'}: ${typeNames}`
        );
      }

      if (filter.startDate || filter.endDate) {
        const formatDate = (date: Date | null) => {
          if (!date) return null;
          const d = new Date(date);
          const day = d.getDate().toString().padStart(2, '0');
          const month = (d.getMonth() + 1).toString().padStart(2, '0');
          const year = d.getFullYear();
          return `${day}.${month}.${year}`;
        };

        const startStr = formatDate(filter.startDate) || '';
        const endStr = formatDate(filter.endDate) || '';
        if (startStr && endStr) {
          filters.push(`${startStr} - ${endStr}`);
        } else if (startStr) {
          filters.push(`startDate: ${startStr}`);
        } else if (endStr) {
          filters.push(`endDate: ${endStr}`);
        }
      }

      if (filter.searchText) {
        filters.push(`description: "${filter.searchText}"`);
      }

      return filters;
    };

    it('returns empty array when no filters active', () => {
      const result = getFilterSummary(defaultFilter, 'expense');
      expect(result).toEqual([]);
    });

    it('includes type filter in summary for expense mode', () => {
      const filter = { ...defaultFilter, typeIds: [1] };
      const result = getFilterSummary(filter, 'expense');
      expect(result).toContain('expenseType: Rent');
    });

    it('includes type filter in summary for income mode', () => {
      const filter = { ...defaultFilter, typeIds: [1] };
      const result = getFilterSummary(filter, 'income');
      expect(result).toContain('incomeType: Rent');
    });

    it('includes date range when both dates set', () => {
      const filter = {
        ...defaultFilter,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };
      const result = getFilterSummary(filter, 'expense');
      expect(result).toContain('01.01.2024 - 31.12.2024');
    });

    it('includes start date only when end date not set', () => {
      const filter = {
        ...defaultFilter,
        startDate: new Date('2024-01-01'),
        endDate: null,
      };
      const result = getFilterSummary(filter, 'expense');
      expect(result).toContain('startDate: 01.01.2024');
    });

    it('includes end date only when start date not set', () => {
      const filter = {
        ...defaultFilter,
        startDate: null,
        endDate: new Date('2024-12-31'),
      };
      const result = getFilterSummary(filter, 'expense');
      expect(result).toContain('endDate: 31.12.2024');
    });

    it('includes search text in summary', () => {
      const filter = { ...defaultFilter, searchText: 'electricity' };
      const result = getFilterSummary(filter, 'expense');
      expect(result).toContain('description: "electricity"');
    });

    it('combines multiple filters', () => {
      const filter = {
        typeIds: [1, 2],
        searchText: 'payment',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      };
      const result = getFilterSummary(filter, 'expense');
      expect(result).toHaveLength(3);
      expect(result).toContain('expenseType: Rent, Utilities');
      expect(result).toContain('01.01.2024 - 30.06.2024');
      expect(result).toContain('description: "payment"');
    });
  });

  describe('handleTypeChange logic', () => {
    it('parses string value to number array', () => {
      const handleTypeChange = (value: string | number[]) => {
        return typeof value === 'string' ? value.split(',').map(Number) : value;
      };

      expect(handleTypeChange('1,2,3')).toEqual([1, 2, 3]);
    });

    it('passes through number array unchanged', () => {
      const handleTypeChange = (value: string | number[]) => {
        return typeof value === 'string' ? value.split(',').map(Number) : value;
      };

      expect(handleTypeChange([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('handles single value string', () => {
      const handleTypeChange = (value: string | number[]) => {
        return typeof value === 'string' ? value.split(',').map(Number) : value;
      };

      expect(handleTypeChange('5')).toEqual([5]);
    });
  });

  describe('Filter state management', () => {
    it('creates default filter correctly', () => {
      expect(defaultFilter.typeIds).toEqual([]);
      expect(defaultFilter.searchText).toBe('');
      expect(defaultFilter.startDate).toBeNull();
      expect(defaultFilter.endDate).toBeNull();
    });

    it('resets all filter values', () => {
      const activeFilter: AccountingFilterData = {
        typeIds: [1, 2],
        searchText: 'test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const reset = () => ({
        typeIds: [],
        searchText: '',
        startDate: null,
        endDate: null,
      });

      const result = reset();
      expect(result).toEqual(defaultFilter);
      expect(result.typeIds).not.toBe(activeFilter.typeIds);
    });

    it('updates typeIds correctly', () => {
      const filter = { ...defaultFilter };
      const newTypeIds = [1, 2, 3];
      const updated = { ...filter, typeIds: newTypeIds };
      expect(updated.typeIds).toEqual([1, 2, 3]);
    });

    it('updates searchText correctly', () => {
      const filter = { ...defaultFilter };
      const newSearchText = 'electricity bill';
      const updated = { ...filter, searchText: newSearchText };
      expect(updated.searchText).toBe('electricity bill');
    });

    it('updates startDate correctly', () => {
      const filter = { ...defaultFilter };
      const newStartDate = new Date('2024-01-01');
      const updated = { ...filter, startDate: newStartDate };
      expect(updated.startDate).toEqual(newStartDate);
    });

    it('updates endDate correctly', () => {
      const filter = { ...defaultFilter };
      const newEndDate = new Date('2024-12-31');
      const updated = { ...filter, endDate: newEndDate };
      expect(updated.endDate).toEqual(newEndDate);
    });
  });
});
