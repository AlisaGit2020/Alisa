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
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Title from "../../../Title";
import { useStatisticsData } from "./hooks/useStatisticsData";

function IncomeExpenseChart() {
  const theme = useTheme();
  const { t } = useTranslation("dashboard");
  const { data, loading, error } = useStatisticsData();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <>
        <Title>{t("incomeAndExpenses")}</Title>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <Typography color="text.secondary">{t("noData")}</Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Title>{t("incomeAndExpenses")}</Title>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
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
            name={t("income")}
            fill={theme.palette.success.main}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expense"
            name={t("expenses")}
            fill={theme.palette.error.main}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

export default IncomeExpenseChart;
