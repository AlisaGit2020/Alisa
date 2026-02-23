import { calculateSummaryData, SummaryData } from "./report-utils";
import { PropertyStatistics } from "@asset-types";

// Factory to create test statistics
const createStatistic = (
  overrides: Partial<PropertyStatistics> = {}
): PropertyStatistics => ({
  id: 1,
  propertyId: 1,
  key: "income",
  year: 2024,
  month: 0,
  value: "0",
  ...overrides,
});

describe("report-utils", () => {
  describe("calculateSummaryData", () => {
    const currentYear = 2024;

    it("returns zeros for empty statistics array", () => {
      const result = calculateSummaryData([], currentYear);

      expect(result).toEqual<SummaryData>({
        currentYearIncome: 0,
        currentYearExpenses: 0,
        allTimeBalance: 0,
        allTimeNetIncome: 0,
      });
    });

    it("calculates current year income and expenses from yearly stats", () => {
      const statistics: PropertyStatistics[] = [
        createStatistic({ key: "income", year: 2024, month: 0, value: "1000" }),
        createStatistic({
          key: "expense",
          year: 2024,
          month: 0,
          value: "400",
        }),
      ];

      const result = calculateSummaryData(statistics, currentYear);

      expect(result.currentYearIncome).toBe(1000);
      expect(result.currentYearExpenses).toBe(400);
    });

    it("ignores monthly stats for yearly totals", () => {
      const statistics: PropertyStatistics[] = [
        // Yearly stat (month = 0 or falsy)
        createStatistic({ key: "income", year: 2024, month: 0, value: "1000" }),
        // Monthly stat - should be ignored for all-time totals
        createStatistic({ key: "income", year: 2024, month: 6, value: "500" }),
      ];

      const result = calculateSummaryData(statistics, currentYear);

      // Only the yearly stat should be counted
      expect(result.allTimeNetIncome).toBe(1000);
    });

    it("calculates all-time totals from multiple years", () => {
      const statistics: PropertyStatistics[] = [
        createStatistic({ key: "income", year: 2022, month: 0, value: "1000" }),
        createStatistic({ key: "income", year: 2023, month: 0, value: "1500" }),
        createStatistic({ key: "income", year: 2024, month: 0, value: "2000" }),
        createStatistic({ key: "expense", year: 2022, month: 0, value: "500" }),
        createStatistic({ key: "expense", year: 2023, month: 0, value: "600" }),
        createStatistic({ key: "expense", year: 2024, month: 0, value: "700" }),
      ];

      const result = calculateSummaryData(statistics, currentYear);

      // All-time income: 1000 + 1500 + 2000 = 4500
      // All-time expenses: 500 + 600 + 700 = 1800
      // Net income: 4500 - 1800 = 2700
      expect(result.allTimeNetIncome).toBe(2700);

      // Current year only
      expect(result.currentYearIncome).toBe(2000);
      expect(result.currentYearExpenses).toBe(700);
    });

    it("includes deposits and withdrawals in balance calculation", () => {
      const statistics: PropertyStatistics[] = [
        createStatistic({ key: "income", year: 2024, month: 0, value: "1000" }),
        createStatistic({ key: "expense", year: 2024, month: 0, value: "400" }),
        createStatistic({ key: "deposit", year: 2024, month: 0, value: "5000" }),
        createStatistic({
          key: "withdraw",
          year: 2024,
          month: 0,
          value: "200",
        }),
      ];

      const result = calculateSummaryData(statistics, currentYear);

      // Balance = income + deposit - expense - withdraw
      // Balance = 1000 + 5000 - 400 - 200 = 5400
      expect(result.allTimeBalance).toBe(5400);

      // Net income does NOT include deposits/withdrawals
      // Net income = income - expense = 1000 - 400 = 600
      expect(result.allTimeNetIncome).toBe(600);
    });

    it("handles statistics from non-current years correctly", () => {
      const statistics: PropertyStatistics[] = [
        createStatistic({ key: "income", year: 2023, month: 0, value: "1000" }),
        createStatistic({ key: "expense", year: 2023, month: 0, value: "500" }),
      ];

      const result = calculateSummaryData(statistics, currentYear);

      // Current year should be 0 since all stats are from 2023
      expect(result.currentYearIncome).toBe(0);
      expect(result.currentYearExpenses).toBe(0);

      // All-time should include historical data
      expect(result.allTimeNetIncome).toBe(500);
    });

    it("handles mixed yearly and monthly statistics correctly", () => {
      const statistics: PropertyStatistics[] = [
        // Yearly totals
        createStatistic({ key: "income", year: 2024, month: 0, value: "12000" }),
        createStatistic({ key: "expense", year: 2024, month: 0, value: "6000" }),
        // Monthly breakdowns (should not be double-counted)
        createStatistic({ key: "income", year: 2024, month: 1, value: "1000" }),
        createStatistic({ key: "income", year: 2024, month: 2, value: "1000" }),
        createStatistic({ key: "expense", year: 2024, month: 1, value: "500" }),
      ];

      const result = calculateSummaryData(statistics, currentYear);

      // Should only count yearly stats
      expect(result.currentYearIncome).toBe(12000);
      expect(result.currentYearExpenses).toBe(6000);
      expect(result.allTimeNetIncome).toBe(6000);
    });

    it("handles invalid/NaN values gracefully", () => {
      const statistics: PropertyStatistics[] = [
        createStatistic({ key: "income", year: 2024, month: 0, value: "invalid" }),
        createStatistic({ key: "expense", year: 2024, month: 0, value: "" }),
        createStatistic({ key: "deposit", year: 2024, month: 0, value: "1000" }),
      ];

      const result = calculateSummaryData(statistics, currentYear);

      // Invalid values should be treated as 0
      expect(result.currentYearIncome).toBe(0);
      expect(result.currentYearExpenses).toBe(0);
      expect(result.allTimeBalance).toBe(1000);
    });

    it("handles decimal values correctly", () => {
      const statistics: PropertyStatistics[] = [
        createStatistic({ key: "income", year: 2024, month: 0, value: "1234.56" }),
        createStatistic({ key: "expense", year: 2024, month: 0, value: "567.89" }),
      ];

      const result = calculateSummaryData(statistics, currentYear);

      expect(result.currentYearIncome).toBeCloseTo(1234.56);
      expect(result.currentYearExpenses).toBeCloseTo(567.89);
      expect(result.allTimeNetIncome).toBeCloseTo(666.67);
    });

    it("calculates correctly with large dataset", () => {
      const statistics: PropertyStatistics[] = [];

      // Add 5 years of yearly data
      for (let year = 2020; year <= 2024; year++) {
        statistics.push(
          createStatistic({ key: "income", year, month: 0, value: "10000" }),
          createStatistic({ key: "expense", year, month: 0, value: "4000" }),
          createStatistic({ key: "deposit", year, month: 0, value: "2000" }),
          createStatistic({ key: "withdraw", year, month: 0, value: "1000" })
        );
      }

      const result = calculateSummaryData(statistics, currentYear);

      // All-time totals (5 years)
      // Income: 5 * 10000 = 50000
      // Expense: 5 * 4000 = 20000
      // Deposit: 5 * 2000 = 10000
      // Withdraw: 5 * 1000 = 5000
      // Net income: 50000 - 20000 = 30000
      // Balance: 50000 + 10000 - 20000 - 5000 = 35000
      expect(result.allTimeNetIncome).toBe(30000);
      expect(result.allTimeBalance).toBe(35000);

      // Current year only
      expect(result.currentYearIncome).toBe(10000);
      expect(result.currentYearExpenses).toBe(4000);
    });
  });
});
