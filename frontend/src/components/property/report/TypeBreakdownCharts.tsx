import { useTheme } from "@mui/material/styles";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Box,
  Paper,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Grid,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import React, { useState, useMemo } from "react";
import { Transaction } from "@alisa-types";
import { TransactionType } from "@alisa-types/common";

interface TypeBreakdownChartsProps {
  transactions: Transaction[];
  loading?: boolean;
  height?: number;
}

type ViewMode = "byType" | "byTransactionType";

// Color palette for pie chart segments
const COLORS = [
  "#2196F3", // blue
  "#4CAF50", // green
  "#FF9800", // orange
  "#9C27B0", // purple
  "#F44336", // red
  "#00BCD4", // cyan
  "#FFEB3B", // yellow
  "#795548", // brown
];

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

function TypeBreakdownCharts({
  transactions,
  loading = false,
  height = 300,
}: TypeBreakdownChartsProps) {
  const theme = useTheme();
  const { t } = useTranslation("property");
  const [viewMode, setViewMode] = useState<ViewMode>("byType");

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: ViewMode | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Aggregate transactions by expense/income type
  const { expensesByType, incomesByType } = useMemo(() => {
    const expenseMap = new Map<string, number>();
    const incomeMap = new Map<string, number>();

    transactions.forEach((tx) => {
      if (tx.type === TransactionType.EXPENSE && tx.expense?.expenseType) {
        const typeName = tx.expense.expenseType.name;
        const current = expenseMap.get(typeName) || 0;
        expenseMap.set(typeName, current + Math.abs(tx.amount));
      } else if (tx.type === TransactionType.INCOME && tx.income?.incomeType) {
        const typeName = tx.income.incomeType.name;
        const current = incomeMap.get(typeName) || 0;
        incomeMap.set(typeName, current + Math.abs(tx.amount));
      }
    });

    const expensesByType: ChartDataItem[] = Array.from(expenseMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    const incomesByType: ChartDataItem[] = Array.from(incomeMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    return { expensesByType, incomesByType };
  }, [transactions]);

  // Aggregate by transaction type
  const transactionTypeData = useMemo(() => {
    const typeMap = new Map<TransactionType, number>();

    transactions.forEach((tx) => {
      const current = typeMap.get(tx.type) || 0;
      typeMap.set(tx.type, current + Math.abs(tx.amount));
    });

    const typeColors: Record<TransactionType, string> = {
      [TransactionType.INCOME]: theme.palette.success.main,
      [TransactionType.EXPENSE]: theme.palette.error.main,
      [TransactionType.DEPOSIT]: theme.palette.info.main,
      [TransactionType.WITHDRAW]: theme.palette.warning.main,
      [TransactionType.UNKNOWN]: theme.palette.grey[500],
    };

    const typeLabels: Record<TransactionType, string> = {
      [TransactionType.INCOME]: t("report.income"),
      [TransactionType.EXPENSE]: t("report.expenses"),
      [TransactionType.DEPOSIT]: "Deposit",
      [TransactionType.WITHDRAW]: "Withdraw",
      [TransactionType.UNKNOWN]: "Unknown",
    };

    return Array.from(typeMap.entries())
      .map(([type, value]) => ({
        name: typeLabels[type],
        value,
        color: typeColors[type],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions, theme, t]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const totalExpenses = expensesByType.reduce((sum, item) => sum + item.value, 0);
  const totalIncome = incomesByType.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={height} />
      </Paper>
    );
  }

  const hasData = transactions.length > 0;

  const renderDonutChart = (
    data: ChartDataItem[],
    title: string,
    total: number
  ) => (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="subtitle1" gutterBottom>
        {title}
      </Typography>
      {data.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: height - 50,
          }}
        >
          <Typography color="text.secondary">
            {t("report.noDataForYear")}
          </Typography>
        </Box>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={height - 50}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  borderColor: theme.palette.divider,
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: theme.palette.text.primary }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          <Typography variant="h6" sx={{ mt: -2 }}>
            {formatCurrency(total)}
          </Typography>
        </>
      )}
    </Box>
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="h6">
          {viewMode === "byType"
            ? t("report.expenseBreakdown") + " & " + t("report.incomeBreakdown")
            : t("report.byTransactionType")}
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
        >
          <ToggleButton value="byType">{t("report.byType")}</ToggleButton>
          <ToggleButton value="byTransactionType">
            {t("report.byTransactionType")}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {!hasData ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: height,
          }}
        >
          <Typography color="text.secondary">
            {t("report.noDataForYear")}
          </Typography>
        </Box>
      ) : viewMode === "byType" ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            {renderDonutChart(
              expensesByType,
              t("report.expenseBreakdown"),
              totalExpenses
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {renderDonutChart(
              incomesByType,
              t("report.incomeBreakdown"),
              totalIncome
            )}
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ maxWidth: 400, mx: "auto" }}>
          {renderDonutChart(
            transactionTypeData,
            t("report.byTransactionType"),
            transactionTypeData.reduce((sum, item) => sum + item.value, 0)
          )}
        </Box>
      )}
    </Paper>
  );
}

export default TypeBreakdownCharts;
