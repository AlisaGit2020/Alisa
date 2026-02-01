import {
  Grid,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import IncomeExpenseChart from "./widgets/IncomeExpenseChart.tsx";
import IncomeChart from "./widgets/IncomeChart.tsx";
import ExpenseChart from "./widgets/ExpenseChart.tsx";
import NetResultChart from "./widgets/NetResultChart.tsx";
import { useDashboard, ViewMode } from "./context/DashboardContext.tsx";

function Dashboard() {
  const { t } = useTranslation("dashboard");
  const { t: tAppBar } = useTranslation("appBar");
  const { viewMode, setViewMode, selectedYear, setSelectedYear, availableYears } =
    useDashboard();

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: ViewMode | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(event.target.value as number);
  };

  return (
    <Grid container spacing={3}>
      {/* Welcome message and controls */}
      <Grid size={12}>
        <Paper elevation={5} sx={{ p: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Typography sx={{ fontSize: "medium" }}>{tAppBar("slogan")}</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl
                size="small"
                sx={{
                  minWidth: 100,
                  visibility: viewMode === "monthly" ? "visible" : "hidden",
                }}
              >
                <InputLabel id="dashboard-year-select">{t("year")}</InputLabel>
                <Select
                  labelId="dashboard-year-select"
                  value={selectedYear}
                  label={t("year")}
                  onChange={handleYearChange}
                >
                  {availableYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="monthly">{t("monthly")}</ToggleButton>
                <ToggleButton value="yearly">{t("yearly")}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
        </Paper>
      </Grid>

      {/* #summary - Income & Expenses combined chart */}
      <Grid size={12} id="summary">
        <Paper
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: 400,
          }}
        >
          <IncomeExpenseChart />
        </Paper>
      </Grid>

      {/* #income, #expenses, #netResult - Three charts */}
      <Grid size={{ xs: 12, md: 4 }} id="income">
        <Paper
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: 300,
          }}
        >
          <IncomeChart />
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }} id="expenses">
        <Paper
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: 300,
          }}
        >
          <ExpenseChart />
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }} id="netResult">
        <Paper
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: 300,
          }}
        >
          <NetResultChart />
        </Paper>
      </Grid>
    </Grid>
  );
}

export default Dashboard;
