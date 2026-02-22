import { Transaction, TransactionType, transactionTypeNames } from "@alisa-types";
import DataService from "@alisa-lib/data-service";
import { WithTranslation, withTranslation } from "react-i18next";
import {
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { AlisaButton, AlisaDialog } from "../../alisa";

interface DetailRowProps {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <Grid container spacing={2} sx={{ py: 1 }}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon && (
            <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
          )}
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, sm: 8 }}>
        <Typography
          variant="body1"
          sx={{
            wordBreak: "break-all",
            overflowWrap: "break-word",
          }}
        >
          {value}
        </Typography>
      </Grid>
    </Grid>
  );
}

interface TransactionDetailsProps extends WithTranslation {
  id: number;
  onClose: () => void;
}

function TransactionDetails({ t, id, onClose }: TransactionDetailsProps) {
  const [data, setData] = React.useState<Transaction | null>(null);

  React.useEffect(() => {
    if (id) {
      const dataService = new DataService<Transaction>({
        context: transactionContext,
        relations: {
          expenses: { expenseType: true },
          incomes: { incomeType: true },
        },
      });
      const fetchData = async () => {
        const newData: Transaction = await dataService.read(id);
        setData(newData);
      };

      fetchData();
    }
  }, [id]);

  const getFormatDate = (date: string | Date) => {
    return t("format.date", {
      val: new Date(date),
      formatParams: {
        val: { year: "numeric", month: "numeric", day: "numeric" },
      },
    });
  };

  const getCurrency = (value: number) => {
    return t("format.currency.euro", { val: value });
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return "success";
      case TransactionType.EXPENSE:
        return "error";
      default:
        return "default";
    }
  };

  const getTransactionTypeName = (type: TransactionType) => {
    const name = transactionTypeNames.get(type);
    return name ? t(name) : "";
  };

  if (!data) {
    return null;
  }

  return (
    <AlisaDialog
      open={Boolean(id)}
      onClose={onClose}
      fullWidth={true}
      maxWidth="sm"
      title={t("detailsTitle")}
      actions={<AlisaButton label={t("close")} variant="text" onClick={onClose} />}
    >
      <Stack spacing={3}>
        {/* Amount Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: "action.hover",
            textAlign: "center",
          }}
        >
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              {getCurrency(data.amount)}
            </Typography>
            <Chip
              label={getTransactionTypeName(data.type)}
              color={getTransactionTypeColor(data.type)}
              size="small"
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t("totalAmount")}
          </Typography>
        </Paper>

        {/* Category Section */}
        {((data.expenses && data.expenses.length > 0) ||
          (data.incomes && data.incomes.length > 0)) && (
          <Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              gutterBottom
            >
              {t("category")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {data.expenses?.map((expense, index) => (
                <Chip
                  key={`expense-${index}`}
                  label={expense.expenseType?.key
                    ? t(`expenseTypes.${expense.expenseType.key}`)
                    : ""}
                  variant="outlined"
                  color="error"
                  size="small"
                />
              ))}
              {data.incomes?.map((income, index) => (
                <Chip
                  key={`income-${index}`}
                  label={income.incomeType?.key
                    ? t(`incomeTypes.${income.incomeType.key}`)
                    : ""}
                  variant="outlined"
                  color="success"
                  size="small"
                />
              ))}
            </Stack>
          </Box>
        )}

        <Divider />

        {/* Transaction Details */}
        <Box>
          <DetailRow
            icon={<PersonIcon fontSize="small" />}
            label={t("sender")}
            value={data.sender || "-"}
          />
          <DetailRow
            icon={<PersonIcon fontSize="small" />}
            label={t("receiver")}
            value={data.receiver || "-"}
          />
          <DetailRow
            icon={<DescriptionIcon fontSize="small" />}
            label={t("description")}
            value={data.description || "-"}
          />
        </Box>

        <Divider />

        {/* Dates */}
        <Box>
          <DetailRow
            icon={<CalendarTodayIcon fontSize="small" />}
            label={t("transactionDate")}
            value={getFormatDate(data.transactionDate)}
          />
          <DetailRow
            icon={<CalendarTodayIcon fontSize="small" />}
            label={t("accountingDate")}
            value={getFormatDate(data.accountingDate)}
          />
        </Box>

        <Divider />

        {/* Additional Info */}
        <Box>
          <DetailRow
            icon={<AccountBalanceIcon fontSize="small" />}
            label={t("balance")}
            value={getCurrency(data.balance)}
          />
          <DetailRow
            icon={<ReceiptIcon fontSize="small" />}
            label={t("externalId")}
            value={data.externalId || "-"}
          />
          <DetailRow label={t("id")} value={`#${data.id}`} />
        </Box>

        {/* Expense Details */}
        {data.expenses && data.expenses.length > 0 && (
          <>
            <Divider />
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                {t("expenseDetails")}
              </Typography>
              <Stack spacing={1}>
                {data.expenses.map((expense) => (
                  <Paper
                    key={`expense-detail-${expense.id}`}
                    variant="outlined"
                    sx={{ p: 2 }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={expense.expenseType?.key
                            ? t(`expenseTypes.${expense.expenseType.key}`)
                            : ""}
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="body1" fontWeight="bold">
                          {getCurrency(expense.totalAmount)}
                        </Typography>
                      </Stack>
                      {expense.description && (
                        <Typography variant="body2" color="text.secondary">
                          {expense.description}
                        </Typography>
                      )}
                      {expense.quantity > 1 && (
                        <Typography variant="body2" color="text.secondary">
                          {getCurrency(expense.amount)} x {expense.quantity}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </>
        )}

        {/* Income Details */}
        {data.incomes && data.incomes.length > 0 && (
          <>
            <Divider />
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                {t("incomeDetails")}
              </Typography>
              <Stack spacing={1}>
                {data.incomes.map((income) => (
                  <Paper
                    key={`income-detail-${income.id}`}
                    variant="outlined"
                    sx={{ p: 2 }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={income.incomeType?.key
                            ? t(`incomeTypes.${income.incomeType.key}`)
                            : ""}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="body1" fontWeight="bold">
                          {getCurrency(income.totalAmount)}
                        </Typography>
                      </Stack>
                      {income.description && (
                        <Typography variant="body2" color="text.secondary">
                          {income.description}
                        </Typography>
                      )}
                      {income.quantity > 1 && (
                        <Typography variant="body2" color="text.secondary">
                          {getCurrency(income.amount)} x {income.quantity}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Stack>
    </AlisaDialog>
  );
}

export default withTranslation(transactionContext.name)(TransactionDetails);
