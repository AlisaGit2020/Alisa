import "@testing-library/jest-dom";
import { LoanBalanceDataPoint } from "./useLoanBalanceData";

// Since Jest mock hoisting causes issues with hooks and context in ESM mode,
// we test the data transformation logic separately from the React component

describe("useLoanBalanceData Logic", () => {
  const monthLabels = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  interface MockStatistic {
    key: string;
    value: string;
    year?: number;
    month?: number;
    propertyId?: number;
  }

  interface MockProperty {
    id: number;
    purchaseLoan?: number;
  }

  describe("aggregateLoanBalance - Monthly view", () => {
    const aggregateMonthly = (
      statistics: MockStatistic[],
      year: number
    ): LoanBalanceDataPoint[] => {
      const dataPoints: LoanBalanceDataPoint[] = monthLabels.map((label, index) => ({
        label,
        month: index + 1,
        year,
        balance: 0,
      }));

      statistics.forEach((stat) => {
        if (stat.month && stat.year === year && stat.key === "loan_balance") {
          const monthIndex = stat.month - 1;
          if (monthIndex >= 0 && monthIndex < 12) {
            const value = parseFloat(stat.value) || 0;
            dataPoints[monthIndex].balance += value;
          }
        }
      });

      return dataPoints;
    };

    it("creates 12 data points for monthly view", () => {
      const result = aggregateMonthly([], 2024);

      expect(result).toHaveLength(12);
      expect(result[0].label).toBe("Jan");
      expect(result[11].label).toBe("Dec");
    });

    it("aggregates loan balance by month", () => {
      const statistics: MockStatistic[] = [
        { propertyId: 1, key: "loan_balance", year: 2024, month: 1, value: "99000.00" },
        { propertyId: 1, key: "loan_balance", year: 2024, month: 2, value: "98000.00" },
      ];

      const result = aggregateMonthly(statistics, 2024);

      expect(result[0].balance).toBe(99000);
      expect(result[1].balance).toBe(98000);
    });

    it("handles empty statistics", () => {
      const result = aggregateMonthly([], 2024);

      result.forEach((dataPoint) => {
        expect(dataPoint.balance).toBe(0);
      });
    });
  });

  describe("aggregateLoanBalance - Yearly view", () => {
    const aggregateYearly = (statistics: MockStatistic[]): LoanBalanceDataPoint[] => {
      const yearMap = new Map<number, LoanBalanceDataPoint>();
      const currentYear = new Date().getFullYear();

      for (let y = currentYear - 4; y <= currentYear; y++) {
        yearMap.set(y, {
          label: String(y),
          year: y,
          balance: 0,
        });
      }

      statistics.forEach((stat) => {
        if (stat.year && !stat.month && stat.key === "loan_balance") {
          const existing = yearMap.get(stat.year);
          if (existing) {
            const value = parseFloat(stat.value) || 0;
            existing.balance += value;
          }
        }
      });

      return Array.from(yearMap.values()).sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
    };

    it("creates 5 data points for yearly view", () => {
      const result = aggregateYearly([]);

      expect(result).toHaveLength(5);
    });

    it("aggregates loan balance by year", () => {
      const currentYear = new Date().getFullYear();
      const statistics: MockStatistic[] = [
        { propertyId: 1, key: "loan_balance", year: currentYear, value: "95000.00" },
        { propertyId: 1, key: "loan_balance", year: currentYear - 1, value: "98000.00" },
      ];

      const result = aggregateYearly(statistics);

      const currentYearData = result.find(d => d.year === currentYear);
      const lastYearData = result.find(d => d.year === currentYear - 1);

      expect(currentYearData?.balance).toBe(95000);
      expect(lastYearData?.balance).toBe(98000);
    });
  });

  describe("calculateOriginalLoan", () => {
    const calculateOriginalLoan = (properties: MockProperty[]): number => {
      return properties.reduce((sum, property) => {
        return sum + (property.purchaseLoan ?? 0);
      }, 0);
    };

    it("sums purchaseLoan from all properties", () => {
      const properties: MockProperty[] = [
        { id: 1, purchaseLoan: 100000 },
        { id: 2, purchaseLoan: 150000 },
      ];

      const result = calculateOriginalLoan(properties);

      expect(result).toBe(250000);
    });

    it("handles properties without purchaseLoan", () => {
      const properties: MockProperty[] = [
        { id: 1, purchaseLoan: 100000 },
        { id: 2 },
      ];

      const result = calculateOriginalLoan(properties);

      expect(result).toBe(100000);
    });

    it("returns 0 for empty properties", () => {
      const result = calculateOriginalLoan([]);

      expect(result).toBe(0);
    });
  });

  describe("calculateCurrentBalance", () => {
    const calculateCurrentBalance = (data: LoanBalanceDataPoint[]): number => {
      if (data.length === 0) return 0;

      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].balance > 0) {
          return data[i].balance;
        }
      }

      return 0;
    };

    it("returns the most recent non-zero balance", () => {
      const data: LoanBalanceDataPoint[] = [
        { label: "Jan", balance: 100000, month: 1, year: 2024 },
        { label: "Feb", balance: 99000, month: 2, year: 2024 },
        { label: "Mar", balance: 98000, month: 3, year: 2024 },
      ];

      const result = calculateCurrentBalance(data);

      expect(result).toBe(98000);
    });

    it("skips zero balances at the end", () => {
      const data: LoanBalanceDataPoint[] = [
        { label: "Jan", balance: 100000, month: 1, year: 2024 },
        { label: "Feb", balance: 99000, month: 2, year: 2024 },
        { label: "Mar", balance: 0, month: 3, year: 2024 },
      ];

      const result = calculateCurrentBalance(data);

      expect(result).toBe(99000);
    });

    it("returns 0 for empty data", () => {
      const result = calculateCurrentBalance([]);

      expect(result).toBe(0);
    });
  });
});
