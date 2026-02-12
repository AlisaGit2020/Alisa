import { Grid, Paper, Typography, Box, Skeleton } from "@mui/material";
import { useTranslation } from "react-i18next";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CalculateIcon from "@mui/icons-material/Calculate";

interface PropertySummaryCardsProps {
  currentYearIncome: number;
  currentYearExpenses: number;
  allTimeBalance: number;
  allTimeNetIncome: number;
  loading?: boolean;
}

function PropertySummaryCards({
  currentYearIncome,
  currentYearExpenses,
  allTimeBalance,
  allTimeNetIncome,
  loading = false,
}: PropertySummaryCardsProps) {
  const { t } = useTranslation("property");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const cards = [
    {
      key: "currentYearIncome",
      label: t("report.currentYearIncome"),
      value: currentYearIncome,
      color: "success.main",
      icon: <TrendingUpIcon />,
    },
    {
      key: "currentYearExpenses",
      label: t("report.currentYearExpenses"),
      value: currentYearExpenses,
      color: "error.main",
      icon: <TrendingDownIcon />,
    },
    {
      key: "allTimeBalance",
      label: t("report.allTimeBalance"),
      value: allTimeBalance,
      color: "primary.main",
      icon: <AccountBalanceIcon />,
    },
    {
      key: "allTimeNetIncome",
      label: t("report.allTimeNetIncome"),
      value: allTimeNetIncome,
      color: "info.main",
      icon: <CalculateIcon />,
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid key={card.key} size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              height: "100%",
              borderLeft: 4,
              borderColor: card.color,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Box sx={{ color: card.color, mr: 1, display: "flex" }}>
                {card.icon}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {card.label}
              </Typography>
            </Box>
            {loading ? (
              <Skeleton variant="text" width="80%" height={40} />
            ) : (
              <Typography
                variant="h5"
                sx={{
                  color: card.color,
                  fontWeight: 600,
                }}
              >
                {formatCurrency(card.value)}
              </Typography>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

export default PropertySummaryCards;
