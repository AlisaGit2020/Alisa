import { useTheme } from "@mui/material/styles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Box, Paper, Skeleton, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export interface MonthlyDataPoint {
  label: string;
  month: number;
  income: number;
  expense: number;
}

interface MonthlyBarChartProps {
  data: MonthlyDataPoint[];
  loading?: boolean;
  height?: number;
}

function MonthlyBarChart({
  data,
  loading = false,
  height = 300,
}: MonthlyBarChartProps) {
  const theme = useTheme();
  const { t } = useTranslation("property");

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
        {t("report.monthlyIncomeVsExpenses")}
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
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
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
              formatter={(value) => [`${Number(value).toFixed(2)} €`]}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
              }}
              labelStyle={{ color: theme.palette.text.primary }}
            />
            <Legend />
            <Bar
              dataKey="income"
              name={t("report.income")}
              fill={theme.palette.success.main}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expense"
              name={t("report.expenses")}
              fill={theme.palette.error.main}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

export default MonthlyBarChart;
