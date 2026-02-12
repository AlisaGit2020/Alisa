import { useTheme } from "@mui/material/styles";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Box, Paper, Skeleton, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export interface BalanceDataPoint {
  label: string;
  month: number;
  income: number;
  expense: number;
}

interface BalanceTrendChartProps {
  data: BalanceDataPoint[];
  loading?: boolean;
  height?: number;
}

function BalanceTrendChart({
  data,
  loading = false,
  height = 300,
}: BalanceTrendChartProps) {
  const theme = useTheme();
  const { t } = useTranslation("property");

  // Calculate cumulative balance for each month
  const chartData = useMemo(() => {
    return data.reduce<Array<BalanceDataPoint & { balance: number }>>(
      (acc, point) => {
        const previousBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
        const newBalance = previousBalance + point.income - point.expense;
        acc.push({
          ...point,
          balance: newBalance,
        });
        return acc;
      },
      []
    );
  }, [data]);

  const hasNegativeBalance = useMemo(() => {
    return chartData.some((d) => d.balance < 0);
  }, [chartData]);

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={height} />
      </Paper>
    );
  }

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t("report.balanceTrend")}
      </Typography>
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
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
            <XAxis
              dataKey="label"
              stroke={theme.palette.text.secondary}
              style={theme.typography.body2}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              style={theme.typography.body2}
              tickFormatter={(value) => `${value} €`}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(2)} €`, t("report.allTimeBalance")]}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
              }}
              labelStyle={{ color: theme.palette.text.primary }}
            />
            {hasNegativeBalance && (
              <ReferenceLine
                y={0}
                stroke={theme.palette.error.main}
                strokeDasharray="5 5"
              />
            )}
            <Area
              type="monotone"
              dataKey="balance"
              stroke={theme.palette.primary.main}
              fill="url(#balanceGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

export default BalanceTrendChart;
