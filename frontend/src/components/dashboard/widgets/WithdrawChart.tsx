import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Title from "../../../Title";
import { useStatisticsData } from "./hooks/useStatisticsData";

function WithdrawChart() {
  const theme = useTheme();
  const { t } = useTranslation("dashboard");
  const { t: tTransaction } = useTranslation("transaction");
  const { data, loading, error } = useStatisticsData();

  const totalWithdraw = useMemo(() => {
    return data.reduce((sum, d) => sum + d.withdraw, 0);
  }, [data]);

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

  const hasData = data.some((d) => d.withdraw > 0);

  if (!hasData) {
    return (
      <>
        <Title>{t("withdrawals")}</Title>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <Typography color="text.secondary" variant="body2">{t("noData")}</Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Title>{t("withdrawals")}</Title>
        <Chip
          label={tTransaction("format.currency.euro", { val: totalWithdraw })}
          size="small"
          sx={{
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.common.white,
            fontWeight: "bold",
          }}
        />
      </Stack>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)} €`, t("withdrawals")]}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              borderColor: theme.palette.divider,
            }}
            labelStyle={{ color: theme.palette.text.primary }}
          />
          <Bar
            dataKey="withdraw"
            fill={theme.palette.warning.main}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

export default WithdrawChart;
