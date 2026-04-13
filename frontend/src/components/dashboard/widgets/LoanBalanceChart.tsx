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
import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Title from "../../../Title";
import { useLoanBalanceData } from "./hooks/useLoanBalanceData";

function LoanBalanceChart() {
  const theme = useTheme();
  const { t } = useTranslation("dashboard");
  const { data, originalLoan, currentBalance, loading, error } = useLoanBalanceData();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (originalLoan === 0) {
    return (
      <>
        <Title>{t("loanBalance")}</Title>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <Typography color="text.secondary" variant="body2">{t("noLoanData")}</Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Title>{t("loanBalance")}</Title>
        <Chip
          label={`${currentBalance.toLocaleString()} €`}
          size="small"
          sx={{
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
            fontWeight: "bold",
          }}
        />
      </Stack>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="label"
            stroke={theme.palette.text.secondary}
            style={theme.typography.caption}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            style={theme.typography.caption}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toLocaleString()} €`, t("loanBalance")]}
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
    </>
  );
}

export default LoanBalanceChart;
