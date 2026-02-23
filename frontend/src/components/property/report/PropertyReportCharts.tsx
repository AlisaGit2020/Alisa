import { Box, FormControl, InputLabel, MenuItem, Select, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { SelectChangeEvent } from "@mui/material/Select";
import MonthlyBarChart, { MonthlyDataPoint } from "./MonthlyBarChart";
import BalanceTrendChart from "./BalanceTrendChart";
import TypeBreakdownCharts from "./TypeBreakdownCharts";
import MonthlyTransactionTable from "./MonthlyTransactionTable";
import { PropertyStatistics, Transaction } from "@asset-types";
import ApiClient from "@asset-lib/api-client";
import { VITE_API_URL } from "../../../constants";
import axios from "axios";
import { useToast } from "../../asset/toast";

interface PropertyReportChartsProps {
  propertyId: number;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function PropertyReportCharts({ propertyId }: PropertyReportChartsProps) {
  const { t } = useTranslation("property");
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [statistics, setStatistics] = useState<PropertyStatistics[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Track if an error toast was already shown to avoid multiple toasts when API is down
  const errorToastShownRef = useRef(false);

  // Reset error toast flag when propertyId or year changes
  useEffect(() => {
    errorToastShownRef.current = false;
  }, [propertyId, selectedYear]);

  // Fetch available years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const url = `${VITE_API_URL}/real-estate/property/statistics/years`;
        const options = await ApiClient.getOptions();
        const response = await axios.get<number[]>(url, options);
        const years = response.data;
        if (years.length > 0) {
          setAvailableYears(years);
          // If current year not in list, select the most recent
          if (!years.includes(currentYear)) {
            setSelectedYear(Math.max(...years));
          }
        } else {
          // Default to current and previous years
          setAvailableYears([currentYear - 1, currentYear]);
        }
      } catch (error) {
        console.error("Failed to fetch years:", error);
        setAvailableYears([currentYear - 1, currentYear]);
        if (!errorToastShownRef.current) {
          errorToastShownRef.current = true;
          showToast({ message: t("report.fetchError"), severity: "error" });
        }
      }
    };

    fetchYears();
  }, [currentYear, showToast, t]);

  // Fetch statistics for the selected year
  useEffect(() => {
    const fetchStatistics = async () => {
      setLoadingStats(true);
      try {
        const url = `${VITE_API_URL}/real-estate/property/${propertyId}/statistics/search`;
        const options = await ApiClient.getOptions();
        const response = await axios.post<PropertyStatistics[]>(
          url,
          { year: selectedYear, includeMonthly: true },
          options
        );
        setStatistics(response.data);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
        setStatistics([]);
        if (!errorToastShownRef.current) {
          errorToastShownRef.current = true;
          showToast({ message: t("report.fetchError"), severity: "error" });
        }
      } finally {
        setLoadingStats(false);
      }
    };

    if (propertyId) {
      fetchStatistics();
    }
  }, [propertyId, selectedYear, showToast, t]);

  // Fetch transactions for the selected year (for pie charts)
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      try {
        const url = `${VITE_API_URL}/real-estate/property/${propertyId}/transactions/search`;
        const options = await ApiClient.getOptions();
        const response = await axios.post<Transaction[]>(
          url,
          { year: selectedYear },
          options
        );
        setTransactions(response.data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
        if (!errorToastShownRef.current) {
          errorToastShownRef.current = true;
          showToast({ message: t("report.fetchError"), severity: "error" });
        }
      } finally {
        setLoadingTransactions(false);
      }
    };

    if (propertyId) {
      fetchTransactions();
    }
  }, [propertyId, selectedYear, showToast, t]);

  const handleYearChange = useCallback((event: SelectChangeEvent<number>) => {
    setSelectedYear(event.target.value as number);
  }, []);

  // Transform statistics to monthly data points
  const monthlyData: MonthlyDataPoint[] = useMemo(() => {
    const dataPoints: MonthlyDataPoint[] = MONTH_LABELS.map((label, index) => ({
      label,
      month: index + 1,
      income: 0,
      expense: 0,
    }));

    statistics.forEach((stat) => {
      if (stat.month && stat.year === selectedYear) {
        const monthIndex = stat.month - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          const value = parseFloat(stat.value) || 0;
          if (stat.key === "income") {
            dataPoints[monthIndex].income += value;
          } else if (stat.key === "expense") {
            dataPoints[monthIndex].expense += value;
          }
        }
      }
    });

    return dataPoints;
  }, [statistics, selectedYear]);

  // Monthly summaries for the table
  const monthlySummaries = useMemo(() => {
    return monthlyData.map((data) => ({
      month: data.month,
      year: selectedYear,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    }));
  }, [monthlyData, selectedYear]);

  return (
    <Stack spacing={3}>
      {/* Year selector */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t("report.year")}</InputLabel>
          <Select
            value={selectedYear}
            label={t("report.year")}
            onChange={handleYearChange}
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Monthly Bar Chart */}
      <MonthlyBarChart data={monthlyData} loading={loadingStats} />

      {/* Balance Trend Chart */}
      <BalanceTrendChart data={monthlyData} loading={loadingStats} />

      {/* Type Breakdown Charts */}
      <TypeBreakdownCharts
        transactions={transactions}
        loading={loadingTransactions}
      />

      {/* Monthly Transaction Table */}
      <MonthlyTransactionTable
        propertyId={propertyId}
        monthlySummaries={monthlySummaries}
        loading={loadingStats}
      />
    </Stack>
  );
}

export default PropertyReportCharts;
