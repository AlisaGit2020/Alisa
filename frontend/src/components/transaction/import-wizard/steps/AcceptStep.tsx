import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AssetButton from "../../../asset/form/AssetButton";
import { TFunction } from "i18next";
import { Transaction, TransactionType, transactionTypeNames } from "@asset-types";
import { AssetApproveIcon } from "../../../asset/AssetIcons";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import SavingsIcon from "@mui/icons-material/Savings";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

interface AcceptStepProps {
  t: TFunction;
  transactions: Transaction[];
  isApproving: boolean;
  approveError: string | null;
  onApprove: () => Promise<boolean>;
  onNext: () => void;
  onBack: () => void;
}

const typeIcons: Record<TransactionType, React.ReactNode> = {
  [TransactionType.UNKNOWN]: null,
  [TransactionType.INCOME]: <AttachMoneyIcon color="success" />,
  [TransactionType.EXPENSE]: <MoneyOffIcon color="error" />,
  [TransactionType.DEPOSIT]: <SavingsIcon color="primary" />,
  [TransactionType.WITHDRAW]: <AccountBalanceWalletIcon color="warning" />,
};

export default function AcceptStep({
  t,
  transactions,
  isApproving,
  approveError,
  onApprove,
  onNext,
  onBack,
}: AcceptStepProps) {
  const summary = useMemo(() => {
    const byType = new Map<TransactionType, { count: number; amount: number }>();

    for (const transaction of transactions) {
      const existing = byType.get(transaction.type) || { count: 0, amount: 0 };
      existing.count++;
      existing.amount += transaction.amount;
      byType.set(transaction.type, existing);
    }

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    return { byType, totalAmount };
  }, [transactions]);

  const handleApprove = async () => {
    const success = await onApprove();
    if (success) {
      onNext();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("importWizard.readyToApprove")}
        </Typography>

        <Typography variant="body1" sx={{ mb: 3 }}>
          {t("importWizard.transactionCount", { count: transactions.length })}
        </Typography>

        {/* Breakdown by type */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {t("importWizard.breakdown")}
        </Typography>

        <List dense>
          {Array.from(summary.byType.entries()).map(([type, data]) => (
            <ListItem key={type}>
              <ListItemIcon>{typeIcons[type]}</ListItemIcon>
              <ListItemText
                primary={t(transactionTypeNames.get(type) || "unknown")}
                secondary={`${data.count} ${t("importWizard.transactions")}`}
              />
              <Typography
                variant="body2"
                color={data.amount >= 0 ? "success.main" : "error.main"}
              >
                {formatCurrency(data.amount)}
              </Typography>
            </ListItem>
          ))}
        </List>

        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {t("importWizard.total")}
          </Typography>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color={summary.totalAmount >= 0 ? "success.main" : "error.main"}
          >
            {formatCurrency(summary.totalAmount)}
          </Typography>
        </Box>
      </Paper>

      {approveError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {approveError}
        </Alert>
      )}

      {/* Navigation buttons */}
      <Stack
        direction="row"
        spacing={2}
        justifyContent="space-between"
        sx={{ mt: 3 }}
      >
        <AssetButton
          label={t("importWizard.back")}
          onClick={onBack}
          disabled={isApproving}
        />
        <AssetButton
          label={isApproving ? t("importWizard.approving") : t("importWizard.approveAll")}
          variant="contained"
          color="success"
          onClick={handleApprove}
          disabled={isApproving}
          loading={isApproving}
          startIcon={!isApproving ? <AssetApproveIcon /> : undefined}
        />
      </Stack>
    </Box>
  );
}
