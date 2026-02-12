import { PropertyStatistics } from "@alisa-types";

export interface SummaryData {
  currentYearIncome: number;
  currentYearExpenses: number;
  allTimeBalance: number;
  allTimeNetIncome: number;
}

export function calculateSummaryData(
  statistics: PropertyStatistics[],
  currentYear: number
): SummaryData {
  let currentYearIncome = 0;
  let currentYearExpenses = 0;
  let allTimeIncome = 0;
  let allTimeExpenses = 0;
  let allTimeDeposit = 0;
  let allTimeWithdraw = 0;

  statistics.forEach((stat) => {
    const value = parseFloat(stat.value) || 0;

    // All-time totals (yearly stats without month)
    if (stat.year && !stat.month) {
      if (stat.key === "income") {
        allTimeIncome += value;
      } else if (stat.key === "expense") {
        allTimeExpenses += value;
      } else if (stat.key === "deposit") {
        allTimeDeposit += value;
      } else if (stat.key === "withdraw") {
        allTimeWithdraw += value;
      }

      // Current year
      if (stat.year === currentYear) {
        if (stat.key === "income") {
          currentYearIncome += value;
        } else if (stat.key === "expense") {
          currentYearExpenses += value;
        }
      }
    }
  });

  // Balance = all income + deposits - expenses - withdrawals
  const allTimeBalance =
    allTimeIncome + allTimeDeposit - allTimeExpenses - allTimeWithdraw;
  const allTimeNetIncome = allTimeIncome - allTimeExpenses;

  return {
    currentYearIncome,
    currentYearExpenses,
    allTimeBalance,
    allTimeNetIncome,
  };
}
