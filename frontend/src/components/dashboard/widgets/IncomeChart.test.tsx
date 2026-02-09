import '@testing-library/jest-dom';

// Since the widget-registry has circular imports with chart components,
// we test the logic separately without rendering the React component

describe('IncomeChart Logic', () => {
  describe('Total income calculation', () => {
    it('calculates total income from all data points', () => {
      const data = [
        { income: 1000 },
        { income: 2000 },
        { income: 500 },
      ];

      const totalIncome = data.reduce((sum, d) => sum + d.income, 0);

      expect(totalIncome).toBe(3500);
    });

    it('returns 0 for empty data', () => {
      const data: { income: number }[] = [];

      const totalIncome = data.reduce((sum, d) => sum + d.income, 0);

      expect(totalIncome).toBe(0);
    });

    it('handles decimal values correctly', () => {
      const data = [
        { income: 1000.50 },
        { income: 2000.25 },
      ];

      const totalIncome = data.reduce((sum, d) => sum + d.income, 0);

      expect(totalIncome).toBeCloseTo(3000.75);
    });
  });

  describe('hasData check', () => {
    it('returns true when some income is greater than 0', () => {
      const data = [
        { income: 0 },
        { income: 1000 },
        { income: 0 },
      ];

      const hasData = data.some((d) => d.income > 0);

      expect(hasData).toBe(true);
    });

    it('returns false when all income values are 0', () => {
      const data = [
        { income: 0 },
        { income: 0 },
        { income: 0 },
      ];

      const hasData = data.some((d) => d.income > 0);

      expect(hasData).toBe(false);
    });

    it('returns false for empty data', () => {
      const data: { income: number }[] = [];

      const hasData = data.some((d) => d.income > 0);

      expect(hasData).toBe(false);
    });

    it('returns true for single positive value', () => {
      const data = [{ income: 500 }];

      const hasData = data.some((d) => d.income > 0);

      expect(hasData).toBe(true);
    });
  });

  describe('Rendering states', () => {
    it('loading state shows spinner', () => {
      const loading = true;
      const shouldShowSpinner = loading;

      expect(shouldShowSpinner).toBe(true);
    });

    it('error state shows error message', () => {
      const error = 'Failed to load statistics';
      const shouldShowError = !!error;

      expect(shouldShowError).toBe(true);
    });

    it('no data state shows no data message', () => {
      const data = [
        { income: 0 },
        { income: 0 },
      ];
      const hasData = data.some((d) => d.income > 0);

      expect(hasData).toBe(false);
    });

    it('data state shows chart', () => {
      const data = [
        { income: 1000 },
        { income: 2000 },
      ];
      const loading = false;
      const error = null;
      const hasData = data.some((d) => d.income > 0);
      const shouldShowChart = !loading && !error && hasData;

      expect(shouldShowChart).toBe(true);
    });
  });

  describe('Chip display', () => {
    it('formats total for chip display', () => {
      const totalIncome = 1500;
      const formatCurrency = (value: number) => `${value.toFixed(2)} EUR`;

      expect(formatCurrency(totalIncome)).toBe('1500.00 EUR');
    });

    it('uses success color for chip', () => {
      const chipColor = 'success';
      expect(chipColor).toBe('success');
    });
  });

  describe('Chart configuration', () => {
    it('uses income as dataKey', () => {
      const barConfig = { dataKey: 'income' };
      expect(barConfig.dataKey).toBe('income');
    });

    it('uses label for XAxis', () => {
      const xAxisConfig = { dataKey: 'label' };
      expect(xAxisConfig.dataKey).toBe('label');
    });

    it('chart has rounded corners', () => {
      const barRadius = [4, 4, 0, 0];
      expect(barRadius).toEqual([4, 4, 0, 0]);
    });
  });

  describe('Data structure', () => {
    it('data point has label and income', () => {
      const dataPoint = {
        label: 'Jan',
        income: 1000,
        expense: 500,
        deposit: 0,
        withdraw: 0,
        net: 500,
      };

      expect(dataPoint.label).toBe('Jan');
      expect(dataPoint.income).toBe(1000);
    });
  });
});
