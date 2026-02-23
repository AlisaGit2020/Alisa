import { useState, useEffect } from "react";
import axios from "axios";
import ApiClient from "@asset-lib/api-client";
import { PropertyStatistics } from "@asset-types";
import { useDashboard, ViewMode } from "../../context/DashboardContext";
import { VITE_API_URL } from "../../../../constants";

export interface ChartDataPoint {
  label: string;
  income: number;
  expense: number;
  deposit: number;
  withdraw: number;
  airbnbVisits: number;
  net: number;
  month?: number;
  year?: number;
}

interface UseStatisticsDataResult {
  data: ChartDataPoint[];
  loading: boolean;
  error: string | null;
}

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

async function fetchStatistics(
  propertyId: number | null,
  viewMode: ViewMode,
  year: number
): Promise<PropertyStatistics[]> {
  const url = `${VITE_API_URL}/real-estate/property/statistics/search`;
  const options = await ApiClient.getOptions();

  const body: Record<string, unknown> = {};

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

function aggregateStatistics(
  statistics: PropertyStatistics[],
  viewMode: ViewMode,
  year: number
): ChartDataPoint[] {
  if (viewMode === "monthly") {
    // Create data points for all 12 months
    const dataPoints: ChartDataPoint[] = monthLabels.map((label, index) => ({
      label,
      month: index + 1,
      year,
      income: 0,
      expense: 0,
      deposit: 0,
      withdraw: 0,
      airbnbVisits: 0,
      net: 0,
    }));

    // Aggregate statistics by month
    statistics.forEach((stat) => {
      if (stat.month && stat.year === year) {
        const monthIndex = stat.month - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          const value = parseFloat(stat.value) || 0;
          if (stat.key === "income") {
            dataPoints[monthIndex].income += value;
          } else if (stat.key === "expense") {
            dataPoints[monthIndex].expense += value;
          } else if (stat.key === "deposit") {
            dataPoints[monthIndex].deposit += value;
          } else if (stat.key === "withdraw") {
            dataPoints[monthIndex].withdraw += value;
          } else if (stat.key === "airbnb_visits") {
            dataPoints[monthIndex].airbnbVisits += value;
          }
        }
      }
    });

    // Calculate net for each month
    dataPoints.forEach((dp) => {
      dp.net = dp.income - dp.expense;
    });

    return dataPoints;
  } else {
    // Yearly view - aggregate by year
    const yearMap = new Map<number, ChartDataPoint>();
    const currentYear = new Date().getFullYear();

    // Initialize last 5 years
    for (let y = currentYear - 4; y <= currentYear; y++) {
      yearMap.set(y, {
        label: String(y),
        year: y,
        income: 0,
        expense: 0,
        deposit: 0,
        withdraw: 0,
        airbnbVisits: 0,
        net: 0,
      });
    }

    statistics.forEach((stat) => {
      if (stat.year && !stat.month) {
        const existing = yearMap.get(stat.year);
        if (existing) {
          const value = parseFloat(stat.value) || 0;
          if (stat.key === "income") {
            existing.income += value;
          } else if (stat.key === "expense") {
            existing.expense += value;
          } else if (stat.key === "deposit") {
            existing.deposit += value;
          } else if (stat.key === "withdraw") {
            existing.withdraw += value;
          } else if (stat.key === "airbnb_visits") {
            existing.airbnbVisits += value;
          }
        }
      }
    });

    // Calculate net for each year
    yearMap.forEach((dp) => {
      dp.net = dp.income - dp.expense;
    });

    return Array.from(yearMap.values()).sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  }
}

export function useStatisticsData(): UseStatisticsDataResult {
  const { selectedPropertyId, viewMode, selectedYear, refreshKey } = useDashboard();
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const statistics = await fetchStatistics(
          selectedPropertyId,
          viewMode,
          selectedYear
        );

        if (!cancelled) {
          const aggregated = aggregateStatistics(statistics, viewMode, selectedYear);
          setData(aggregated);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load statistics");
          console.error("Error loading statistics:", err);
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

  return { data, loading, error };
}
