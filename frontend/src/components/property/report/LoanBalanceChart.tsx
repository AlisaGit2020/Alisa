import { useTheme } from "@mui/material/styles";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Box, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export interface LoanBalanceDataPoint {
  label: string;
  month: number;
  balance: number;
}

interface LoanBalanceChartProps {
  data: LoanBalanceDataPoint[];
  originalLoan: number | null;
  loading?: boolean;
  height?: number;
}

function LoanBalanceChart({
  data,
  originalLoan,
  loading = false,
  height = 300,
}: LoanBalanceChartProps) {
  const theme = useTheme();
  const { t } = useTranslation("property");

  const currentBalance = useMemo(() => {
    if (data.length === 0) return originalLoan ?? 0;
    return data[data.length - 1].balance;
  }, [data, originalLoan]);

  const chartData = useMemo(() => {
    if (!originalLoan) return data;
    if (data.length > 0) {
      return [{ label: t("report.originalLoan"), month: 0, balance: originalLoan }, ...data];
    }
    return data;
  }, [data, originalLoan, t]);

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={height} />
      </Paper>
    );
  }

  if (!originalLoan) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t("report.loanBalance")}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: height,
          }}
        >
          <Typography color="text.secondary">
            {t("report.noLoanData")}
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h6">{t("report.loanBalance")}</Typography>
        <Chip
          label={`${t("report.remainingBalance")}: ${currentBalance.toLocaleString()} €`}
          size="small"
          sx={{
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
            fontWeight: "bold",
          }}
        />
      </Stack>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="label"
            stroke={theme.palette.text.secondary}
            style={theme.typography.body2}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            style={theme.typography.body2}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toLocaleString()} €`, t("report.loanBalance")]}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              borderColor: theme.palette.divider,
            }}
            labelStyle={{ color: theme.palette.text.primary }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke={theme.palette.warning.main}
            strokeWidth={2}
            dot={{ fill: theme.palette.warning.main, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}

export default LoanBalanceChart;
