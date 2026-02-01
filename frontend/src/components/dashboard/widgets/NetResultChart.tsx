import { useTheme } from "@mui/material/styles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Title from "../../../Title";
import { useStatisticsData } from "./hooks/useStatisticsData";
import { useMemo } from "react";

function NetResultChart() {
  const theme = useTheme();
  const { t } = useTranslation("dashboard");
  const { t: tTransaction } = useTranslation("transaction");
  const { data, loading, error } = useStatisticsData();

  const totalNet = useMemo(() => {
    return data.reduce((sum, d) => sum + d.net, 0);
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

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <>
        <Title>{t("netResult")}</Title>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <Typography color="text.secondary" variant="body2">{t("noData")}</Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Title>{t("netResult")}</Title>
        <Chip
          label={tTransaction("format.currency.euro", { val: totalNet })}
          size="small"
          sx={{
            backgroundColor: totalNet >= 0 ? theme.palette.success.main : theme.palette.error.main,
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
            formatter={(value) => [`${Number(value).toFixed(2)} €`, t("netResult")]}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              borderColor: theme.palette.divider,
            }}
            labelStyle={{ color: theme.palette.text.primary }}
          />
          <ReferenceLine y={0} stroke={theme.palette.text.secondary} />
          <Bar dataKey="net" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.net >= 0 ? theme.palette.success.main : theme.palette.error.main}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

export default NetResultChart;
