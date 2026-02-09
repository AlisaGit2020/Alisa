import { Box, Paper, Typography, Stack } from "@mui/material";
import AlisaButton from "../../../alisa/form/AlisaButton";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { TFunction } from "i18next";
import { ImportStats } from "../types";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { useNavigate } from "react-router-dom";

interface DoneStepProps {
  t: TFunction;
  stats: ImportStats;
  onReset: () => void;
}

export default function DoneStep({ t, stats, onReset }: DoneStepProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const handleViewTransactions = () => {
    navigate(transactionContext.routePath);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", textAlign: "center" }}>
      <Paper sx={{ p: 4 }}>
        <CheckCircleIcon
          color="success"
          sx={{ fontSize: 64, mb: 2 }}
        />

        <Typography variant="h5" gutterBottom>
          {t("importWizard.importComplete")}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {t("importWizard.successMessage", { count: stats.totalCount })}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 4,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" color="primary">
              {stats.totalCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("importWizard.transactionsImported")}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="h4"
              color={stats.totalAmount >= 0 ? "success.main" : "error.main"}
            >
              {formatCurrency(stats.totalAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("importWizard.netAmount")}
            </Typography>
          </Box>
        </Box>

        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ mt: 4 }}
        >
          <AlisaButton
            label={t("importWizard.importAnotherFile")}
            variant="outlined"
            onClick={onReset}
          />
          <AlisaButton
            label={t("importWizard.viewTransactions")}
            variant="contained"
            onClick={handleViewTransactions}
          />
        </Stack>
      </Paper>
    </Box>
  );
}
