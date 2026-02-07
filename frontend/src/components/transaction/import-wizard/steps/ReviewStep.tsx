import {
  Box,
  Paper,
  Button,
  Alert,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

type SearchField = "all" | "sender" | "receiver" | "description" | "amount";
import { TFunction } from "i18next";
import { Transaction, TransactionType, DataSaveResult } from "@alisa-types";
import AlisaDataTable from "../../../alisa/datatable/AlisaDataTable";
import TransactionsPendingActions from "../../pending/TransactionsPendingActions";
import { useState, useMemo } from "react";

interface ReviewStepProps {
  t: TFunction;
  transactions: Transaction[];
  selectedIds: number[];
  selectedTransactionTypes: TransactionType[];
  hasUnknownTypes: boolean;
  onSelectChange: (id: number, item?: Transaction) => void;
  onSelectAllChange: (ids: number[], items?: Transaction[]) => void;
  onClearSelection: () => void;
  onSetType: (type: number) => Promise<void>;
  onSetCategoryType: (expenseTypeId?: number, incomeTypeId?: number) => Promise<void>;
  onDelete: () => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

export default function ReviewStep({
  t,
  transactions,
  selectedIds,
  selectedTransactionTypes,
  hasUnknownTypes,
  onSelectChange,
  onSelectAllChange,
  onClearSelection,
  onSetType,
  onSetCategoryType,
  onDelete,
  onNext,
  onBack,
}: ReviewStepProps) {
  const [saveResult, setSaveResult] = useState<DataSaveResult | undefined>(
    undefined
  );
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  // Filter transactions based on search text and selected field
  const filteredTransactions = useMemo(() => {
    if (!searchText.trim()) {
      return transactions;
    }
    const search = searchText.toLowerCase();
    return transactions.filter((tx) => {
      const sender = (tx.sender || "").toLowerCase();
      const receiver = (tx.receiver || "").toLowerCase();
      const description = (tx.description || "").toLowerCase();
      const amount = tx.amount.toString();

      switch (searchField) {
        case "sender":
          return sender.includes(search);
        case "receiver":
          return receiver.includes(search);
        case "description":
          return description.includes(search);
        case "amount":
          return amount.includes(search);
        case "all":
        default:
          return (
            sender.includes(search) ||
            receiver.includes(search) ||
            description.includes(search) ||
            amount.includes(search)
          );
      }
    });
  }, [transactions, searchText, searchField]);

  const handleSetType = async (type: number) => {
    setSaveResult(undefined);
    await onSetType(type);
  };

  const handleSetCategoryType = async (
    expenseTypeId?: number,
    incomeTypeId?: number
  ) => {
    setSaveResult(undefined);
    await onSetCategoryType(expenseTypeId, incomeTypeId);
  };

  const handleCancel = () => {
    onClearSelection();
  };

  const hasExpenseTransactions = selectedTransactionTypes.includes(
    TransactionType.EXPENSE
  );
  const hasIncomeTransactions = selectedTransactionTypes.includes(
    TransactionType.INCOME
  );

  return (
    <Box>
      {/* Warning for unknown types */}
      {hasUnknownTypes && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t("importWizard.unknownTypesWarning")}
        </Alert>
      )}

      {/* Search filter */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t("searchField")}</InputLabel>
          <Select
            value={searchField}
            label={t("searchField")}
            onChange={(e) => setSearchField(e.target.value as SearchField)}
          >
            <MenuItem value="all">{t("importWizard.allFields")}</MenuItem>
            <MenuItem value="sender">{t("sender")}</MenuItem>
            <MenuItem value="receiver">{t("receiver")}</MenuItem>
            <MenuItem value="description">{t("description")}</MenuItem>
            <MenuItem value="amount">{t("amount")}</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder={t("search")}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 250 }}
        />
      </Stack>

      {/* Bulk actions */}
      <TransactionsPendingActions
        marginTop={0}
        open={selectedIds.length > 0}
        selectedIds={selectedIds}
        hasExpenseTransactions={hasExpenseTransactions}
        hasIncomeTransactions={hasIncomeTransactions}
        hideApprove
        onApprove={() => Promise.resolve()}
        onSetType={handleSetType}
        onSetCategoryType={handleSetCategoryType}
        onSplitLoanPayment={() => Promise.resolve()}
        onCancel={handleCancel}
        onDelete={onDelete}
        saveResult={saveResult}
      />

      {/* Transaction table */}
      <Paper sx={{ mt: selectedIds.length > 0 ? 2 : 0 }}>
        <AlisaDataTable<Transaction>
          t={t}
          data={filteredTransactions}
          fields={[
            {
              name: "type",
              format: "transactionType",
              label: "",
            },
            { name: "transactionDate", format: "date" },
            { name: "sender", maxLength: 20 },
            { name: "receiver", maxLength: 20 },
            { name: "description", maxLength: 30 },
            { name: "amount", format: "currency", sum: true },
          ]}
          onSelectChange={onSelectChange}
          onSelectAllChange={onSelectAllChange}
          selectedIds={selectedIds}
        />
      </Paper>

      {/* Navigation buttons */}
      <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
        <Button onClick={onBack}>{t("importWizard.back")}</Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={hasUnknownTypes}
        >
          {t("importWizard.next")}
        </Button>
      </Stack>
    </Box>
  );
}
