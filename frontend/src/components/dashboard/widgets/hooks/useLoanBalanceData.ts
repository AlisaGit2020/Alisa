import { useState, useEffect } from "react";
import axios from "axios";
import ApiClient from "@asset-lib/api-client";
import { PropertyStatistics, Property } from "@asset-types";
import { useDashboard, ViewMode } from "../../context/DashboardContext";
import { VITE_API_URL } from "../../../../constants";

export interface LoanBalanceDataPoint {
  label: string;
  balance: number;
  month?: number;
  year?: number;
}

interface UseLoanBalanceDataResult {
  data: LoanBalanceDataPoint[];
  originalLoan: number;
  currentBalance: number;
  loading: boolean;
  error: string | null;
}

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

async function fetchLoanBalanceStatistics(
  propertyId: number | null,
  viewMode: ViewMode,
  year: number
): Promise<PropertyStatistics[]> {
  const url = `${VITE_API_URL}/real-estate/property/statistics/search`;
  const options = await ApiClient.getOptions();

  const body: Record<string, unknown> = {
    key: "loan_balance",
  };

  if (propertyId) {
    body.propertyId = propertyId;
  }

  if (viewMode === "monthly") {
    body.year = year;
    body.includeMonthly = true;
  } else {
    // Yearly view - get all yearly records
    body.includeYearly = true;
  }

  const response = await axios.post<PropertyStatistics[]>(url, body, options);
  return response.data;
}

async function fetchProperties(propertyId: number | null): Promise<Property[]> {
  const url = `${VITE_API_URL}/real-estate/property`;
  const options = await ApiClient.getOptions();

  if (propertyId) {
    const response = await axios.get<Property>(`${url}/${propertyId}`, options);
    return [response.data];
  } else {
    const response = await axios.get<Property[]>(url, options);
    return response.data;
  }
}

function aggregateLoanBalance(
  statistics: PropertyStatistics[],
  viewMode: ViewMode,
  year: number
): LoanBalanceDataPoint[] {
  if (viewMode === "monthly") {
    // Create data points for all 12 months
    const dataPoints: LoanBalanceDataPoint[] = monthLabels.map((label, index) => ({
      label,
      month: index + 1,
      year,
      balance: 0,
    }));

    // Aggregate statistics by month
    statistics.forEach((stat) => {
      if (stat.month && stat.year === year && stat.key === "loan_balance") {
        const monthIndex = stat.month - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          const value = parseFloat(stat.value) || 0;
          dataPoints[monthIndex].balance += value;
        }
      }
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    return dataPoints.filter((dp) => {
      if (dp.balance <= 0) return false;
      if (year === currentYear && (dp.month ?? 0) > currentMonth) return false;
      return true;
    });
  } else {
    // Yearly view - aggregate by year
    const yearMap = new Map<number, LoanBalanceDataPoint>();
    const currentYear = new Date().getFullYear();

    // Initialize last 5 years
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
  }
}

function calculateOriginalLoan(properties: Property[]): number {
  return properties.reduce((sum, property) => {
    return sum + (property.purchaseLoan ?? 0);
  }, 0);
}

function calculateCurrentBalance(data: LoanBalanceDataPoint[]): number {
  if (data.length === 0) return 0;

  // Find the most recent non-zero balance
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].balance > 0) {
      return data[i].balance;
    }
  }

  return 0;
}

export function useLoanBalanceData(): UseLoanBalanceDataResult {
  const { selectedPropertyId, viewMode, selectedYear, refreshKey } = useDashboard();
  const [data, setData] = useState<LoanBalanceDataPoint[]>([]);
  const [originalLoan, setOriginalLoan] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch both statistics and properties in parallel
        const [statistics, properties] = await Promise.all([
          fetchLoanBalanceStatistics(selectedPropertyId, viewMode, selectedYear),
          fetchProperties(selectedPropertyId),
        ]);

        if (!cancelled) {
          const aggregated = aggregateLoanBalance(statistics, viewMode, selectedYear);
          const totalOriginalLoan = calculateOriginalLoan(properties);
          const balance = calculateCurrentBalance(aggregated);

          setData(aggregated);
          setOriginalLoan(totalOriginalLoan);
          setCurrentBalance(balance);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load loan balance data");
          console.error("Error loading loan balance data:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [selectedPropertyId, viewMode, selectedYear, refreshKey]);

  return { data, originalLoan, currentBalance, loading, error };
}
