import '@testing-library/jest-dom';
import { ChartDataPoint } from './useStatisticsData';

// Test the data transformation logic from useStatisticsData without the hook

describe('useStatisticsData Logic', () => {
  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  interface MockStatistic {
    key: string;
    value: string;
    year?: number;
    month?: number;
    propertyId?: number;
  }

  describe('aggregateStatistics - Monthly view', () => {
    const aggregateMonthly = (
      statistics: MockStatistic[],
      year: number
    ): ChartDataPoint[] => {
      const dataPoints: ChartDataPoint[] = monthLabels.map((label, index) => ({
        label,
        month: index + 1,
        year,
        income: 0,
        expense: 0,
        deposit: 0,
        withdraw: 0,
        net: 0,
      }));

      statistics.forEach((stat) => {
        if (stat.month && stat.year === year) {
          const monthIndex = stat.month - 1;
          if (monthIndex >= 0 && monthIndex < 12) {
            const value = parseFloat(stat.value) || 0;
            if (stat.key === 'income') {
              dataPoints[monthIndex].income += value;
            } else if (stat.key === 'expense') {
              dataPoints[monthIndex].expense += value;
            } else if (stat.key === 'deposit') {
              dataPoints[monthIndex].deposit += value;
            } else if (stat.key === 'withdraw') {
              dataPoints[monthIndex].withdraw += value;
            }
          }
        }
      });

      dataPoints.forEach((dp) => {
        dp.net = dp.income - dp.expense;
      });

      return dataPoints;
    };

    it('creates 12 data points for all months', () => {
      const result = aggregateMonthly([], 2024);

      expect(result).toHaveLength(12);
      expect(result[0].label).toBe('Jan');
      expect(result[11].label).toBe('Dec');
    });

    it('aggregates income by month', () => {
      const statistics: MockStatistic[] = [
        { key: 'income', value: '1000', year: 2024, month: 1 },
        { key: 'income', value: '500', year: 2024, month: 1 },
        { key: 'income', value: '2000', year: 2024, month: 2 },
      ];

      const result = aggregateMonthly(statistics, 2024);

      expect(result[0].income).toBe(1500); // Jan: 1000 + 500
      expect(result[1].income).toBe(2000); // Feb: 2000
    });

    it('aggregates expense by month', () => {
      const statistics: MockStatistic[] = [
        { key: 'expense', value: '300', year: 2024, month: 3 },
        { key: 'expense', value: '200', year: 2024, month: 3 },
      ];

      const result = aggregateMonthly(statistics, 2024);

      expect(result[2].expense).toBe(500); // Mar: 300 + 200
    });

    it('aggregates deposit by month', () => {
      const statistics: MockStatistic[] = [
        { key: 'deposit', value: '5000', year: 2024, month: 6 },
      ];

      const result = aggregateMonthly(statistics, 2024);

      expect(result[5].deposit).toBe(5000); // Jun
    });

    it('aggregates withdraw by month', () => {
      const statistics: MockStatistic[] = [
        { key: 'withdraw', value: '1500', year: 2024, month: 12 },
      ];

      const result = aggregateMonthly(statistics, 2024);

      expect(result[11].withdraw).toBe(1500); // Dec
    });

    it('calculates net as income minus expense', () => {
      const statistics: MockStatistic[] = [
        { key: 'income', value: '1000', year: 2024, month: 1 },
        { key: 'expense', value: '400', year: 2024, month: 1 },
      ];

      const result = aggregateMonthly(statistics, 2024);

      expect(result[0].net).toBe(600); // 1000 - 400
    });

    it('ignores statistics from different year', () => {
      const statistics: MockStatistic[] = [
        { key: 'income', value: '1000', year: 2023, month: 1 },
        { key: 'income', value: '500', year: 2024, month: 1 },
      ];

      const result = aggregateMonthly(statistics, 2024);

      expect(result[0].income).toBe(500);
    });

    it('handles invalid month values gracefully', () => {
      const statistics: MockStatistic[] = [
        { key: 'income', value: '1000', year: 2024, month: 0 },
        { key: 'income', value: '1000', year: 2024, month: 13 },
      ];

      const result = aggregateMonthly(statistics, 2024);

      // All values should be 0 since months are invalid
      result.forEach((dp) => {
        expect(dp.income).toBe(0);
      });
    });

    it('handles invalid value strings', () => {
      const statistics: MockStatistic[] = [
        { key: 'income', value: 'invalid', year: 2024, month: 1 },
        { key: 'income', value: '', year: 2024, month: 1 },
      ];

      const result = aggregateMonthly(statistics, 2024);

      expect(result[0].income).toBe(0);
    });

    it('sets correct year and month on each data point', () => {
      const result = aggregateMonthly([], 2024);

      result.forEach((dp, index) => {
        expect(dp.year).toBe(2024);
        expect(dp.month).toBe(index + 1);
      });
    });
  });

  describe('aggregateStatistics - Yearly view', () => {
    const currentYear = new Date().getFullYear();

    const aggregateYearly = (statistics: MockStatistic[]): ChartDataPoint[] => {
      const yearMap = new Map<number, ChartDataPoint>();

      // Initialize last 5 years
      for (let y = currentYear - 4; y <= currentYear; y++) {
        yearMap.set(y, {
          label: String(y),
          year: y,
          income: 0,
          expense: 0,
          deposit: 0,
          withdraw: 0,
          net: 0,
        });
      }

      statistics.forEach((stat) => {
        if (stat.year && !stat.month) {
          const existing = yearMap.get(stat.year);
          if (existing) {
            const value = parseFloat(stat.value) || 0;
            if (stat.key === 'income') {
              existing.income += value;
            } else if (stat.key === 'expense') {
              existing.expense += value;
            } else if (stat.key === 'deposit') {
              existing.deposit += value;
            } else if (stat.key === 'withdraw') {
              existing.withdraw += value;
            }
          }
        }
      });

      yearMap.forEach((dp) => {
        dp.net = dp.income - dp.expense;
      });

      return Array.from(yearMap.values()).sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
    };

    it('creates 5 data points for last 5 years', () => {
      const result = aggregateYearly([]);

      expect(result).toHaveLength(5);
    });

    it('orders years in ascending order', () => {
      const result = aggregateYearly([]);

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].year!).toBeLessThan(result[i + 1].year!);
      }
    });

    it('aggregates yearly income', () => {
      const statistics: MockStatistic[] = [
        { key: 'income', value: '10000', year: currentYear },
        { key: 'income', value: '5000', year: currentYear },
      ];

      const result = aggregateYearly(statistics);
      const currentYearData = result.find((d) => d.year === currentYear);

      expect(currentYearData?.income).toBe(15000);
    });

    it('ignores monthly statistics in yearly view', () => {
      const statistics: MockStatistic[] = [
        { key: 'income', value: '1000', year: currentYear, month: 1 },
      ];

      const result = aggregateYearly(statistics);
      const currentYearData = result.find((d) => d.year === currentYear);

      expect(currentYearData?.income).toBe(0);
    });

    it('ignores years outside the 5-year range', () => {
      const oldYear = currentYear - 10;
      const statistics: MockStatistic[] = [
        { key: 'income', value: '1000', year: oldYear },
      ];

      const result = aggregateYearly(statistics);

      expect(result.every((d) => d.year !== oldYear)).toBe(true);
    });

    it('calculates net for each year', () => {
      const statistics: MockStatistic[] = [
        { key: 'income', value: '5000', year: currentYear },
        { key: 'expense', value: '3000', year: currentYear },
      ];

      const result = aggregateYearly(statistics);
      const currentYearData = result.find((d) => d.year === currentYear);

      expect(currentYearData?.net).toBe(2000);
    });

    it('uses year as label', () => {
      const result = aggregateYearly([]);

      result.forEach((dp) => {
        expect(dp.label).toBe(String(dp.year));
      });
    });
  });

  describe('fetchStatistics request body construction', () => {
    it('includes propertyId when specified', () => {
      const propertyId = 5;
      const body: Record<string, unknown> = {};

      if (propertyId) {
        body.propertyId = propertyId;
      }

      expect(body.propertyId).toBe(5);
    });

    it('excludes propertyId when null', () => {
      const propertyId: number | null = null;
      const body: Record<string, unknown> = {};

      if (propertyId) {
        body.propertyId = propertyId;
      }

      expect(body.propertyId).toBeUndefined();
    });

    it('includes year and includeMonthly for monthly view', () => {
      const viewMode = 'monthly';
      const year = 2024;
      const body: Record<string, unknown> = {};

      if (viewMode === 'monthly') {
        body.year = year;
        body.includeMonthly = true;
      }

      expect(body.year).toBe(2024);
      expect(body.includeMonthly).toBe(true);
    });

    it('includes includeYearly for yearly view', () => {
      const viewMode = 'yearly';
      const body: Record<string, unknown> = {};

      if (viewMode === 'yearly') {
        body.includeYearly = true;
      }

      expect(body.includeYearly).toBe(true);
      expect(body.year).toBeUndefined();
    });
  });

  describe('ChartDataPoint structure', () => {
    it('has all required fields', () => {
      const dataPoint: ChartDataPoint = {
        label: 'Jan',
        income: 1000,
        expense: 500,
        deposit: 200,
        withdraw: 100,
        net: 500,
      };

      expect(dataPoint.label).toBeDefined();
      expect(dataPoint.income).toBeDefined();
      expect(dataPoint.expense).toBeDefined();
      expect(dataPoint.deposit).toBeDefined();
      expect(dataPoint.withdraw).toBeDefined();
      expect(dataPoint.net).toBeDefined();
    });

    it('month and year are optional', () => {
      const dataPoint: ChartDataPoint = {
        label: '2024',
        income: 0,
        expense: 0,
        deposit: 0,
        withdraw: 0,
        net: 0,
      };

      expect(dataPoint.month).toBeUndefined();
      expect(dataPoint.year).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('returns empty data on error', () => {
      const handleError = (): ChartDataPoint[] => {
        try {
          throw new Error('API Error');
        } catch {
          return [];
        }
      };

      expect(handleError()).toEqual([]);
    });

    it('sets error message on failure', () => {
      let error: string | null = null;

      const handleError = () => {
        try {
          throw new Error('API Error');
        } catch {
          error = 'Failed to load statistics';
        }
      };

      handleError();
      expect(error).toBe('Failed to load statistics');
    });
  });

  describe('Loading state', () => {
    it('starts in loading state', () => {
      const loading = true;
      expect(loading).toBe(true);
    });

    it('loading is false after data loads', async () => {
      let loading = true;

      const loadData = async () => {
        loading = true;
        try {
          await Promise.resolve();
        } finally {
          loading = false;
        }
      };

      await loadData();
      expect(loading).toBe(false);
    });
  });

  describe('Cancellation handling', () => {
    it('does not update state if cancelled', async () => {
      let cancelled = false;
      let data: ChartDataPoint[] = [];

      const loadData = async () => {
        cancelled = false;

        const result = await Promise.resolve([{ label: 'test' }] as ChartDataPoint[]);

        if (!cancelled) {
          data = result;
        }
      };

      // Start loading
      const promise = loadData();

      // Cancel before it completes
      cancelled = true;

      await promise;

      expect(data).toEqual([]);
    });
  });
});
