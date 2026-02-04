import { Grid, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface TaxSummaryCardsProps {
  grossIncome: number;
  deductions: number;
  depreciation: number;
  netIncome: number;
}

function TaxSummaryCards({
  grossIncome,
  deductions,
  depreciation,
  netIncome,
}: TaxSummaryCardsProps) {
  const { t } = useTranslation("tax");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const cards = [
    {
      label: t("grossIncome"),
      value: grossIncome,
      color: "success.main",
    },
    {
      label: t("deductions"),
      value: deductions + depreciation,
      color: "error.main",
    },
    {
      label: t("netIncome"),
      value: netIncome,
      color: "primary.main",
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid key={card.label} size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              textAlign: "center",
              borderTop: 4,
              borderColor: card.color,
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {card.label}
            </Typography>
            <Typography variant="h4" sx={{ color: card.color }}>
              {formatCurrency(card.value)}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

export default TaxSummaryCards;
