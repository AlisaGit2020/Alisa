import {
  Box,
  Paper,
  Alert,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import AlisaButton from "../../../alisa/form/AlisaButton";
import SearchIcon from "@mui/icons-material/Search";

type SearchField = "all" | "sender" | "receiver" | "description" | "amount";
import { TFunction } from "i18next";
import { Transaction, TransactionType } from "@alisa-types";
import AlisaDataTable from "../../../alisa/datatable/AlisaDataTable";
import TransactionsPendingActions from "../../pending/TransactionsPendingActions";
import TransactionDetails from "../../components/TransactionDetails";
import { useState, useMemo } from "react";

interface ReviewStepProps {
  t: TFunction;
  transactions: Transaction[];
  selectedIds: number[];
  selectedTransactionTypes: TransactionType[];
  hasUnknownTypes: boolean;
  skippedCount: number;
  supportsLoanSplit?: boolean;
  bankName?: string;
  onSelectChange: (id: number, item?: Transaction) => void;
  onSelectAllChange: (ids: number[], items?: Transaction[]) => void;
  onClearSelection: () => void;
  onSetType: (type: number) => Promise<void>;
  onSetCategoryType: (expenseTypeId?: number, incomeTypeId?: number) => Promise<void>;
  onSplitLoanPayment: (
    principalExpenseTypeId: number,
    interestExpenseTypeId: number,
    handlingFeeExpenseTypeId?: number
  ) => Promise<void>;
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
  skippedCount,
  supportsLoanSplit,
  bankName,
  onSelectChange,
  onSelectAllChange,
  onClearSelection,
  onSetType,
  onSetCategoryType,
  onSplitLoanPayment,
  onDelete,
  onNext,
  onBack,
}: ReviewStepProps) {
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");
  const [showOnlyUnknown, setShowOnlyUnknown] = useState(true);
  const [detailId, setDetailId] = useState<number>(0);

  // Filter transactions based on unknown filter, search text, and selected field
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // First filter by unknown type if enabled
    if (showOnlyUnknown) {
      filtered = filtered.filter((tx) => tx.type === TransactionType.UNKNOWN);
    }

    // Then filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((tx) => {
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
    }

    return filtered;
  }, [transactions, searchText, searchField, showOnlyUnknown]);

  // Count unknown transactions
  const unknownCount = useMemo(() => {
    return transactions.filter((tx) => tx.type === TransactionType.UNKNOWN).length;
  }, [transactions]);

  const handleSetType = async (type: number) => {
    await onSetType(type);
    // Clear search to show remaining unknown rows
    setSearchText("");
  };

  const handleSetCategoryType = async (
    expenseTypeId?: number,
    incomeTypeId?: number
  ) => {
    await onSetCategoryType(expenseTypeId, incomeTypeId);
  };

  const handleSplitLoanPayment = async (
    principalExpenseTypeId: number,
    interestExpenseTypeId: number,
    handlingFeeExpenseTypeId?: number
  ) => {
    await onSplitLoanPayment(principalExpenseTypeId, interestExpenseTypeId, handlingFeeExpenseTypeId);
    // Clear search to show remaining unknown rows
    setSearchText("");
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
      {/* Info about skipped rows */}
      {skippedCount > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("importWizard.skippedRows", { count: skippedCount })}
        </Alert>
      )}

      {/* Info about allocation requirement */}
      {hasUnknownTypes && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("importWizard.allocationRequired")}
        </Alert>
      )}

      {/* Bulk actions - show above filters when rows selected */}
      <TransactionsPendingActions
        marginTop={0}
        open={selectedIds.length > 0}
        selectedIds={selectedIds}
        hasExpenseTransactions={hasExpenseTransactions}
        hasIncomeTransactions={hasIncomeTransactions}
        hideApprove
        supportsLoanSplit={supportsLoanSplit}
        bankName={bankName}
        onApprove={() => Promise.resolve()}
        onSetType={handleSetType}
        onSetCategoryType={handleSetCategoryType}
        onSplitLoanPayment={handleSplitLoanPayment}
        onCancel={handleCancel}
        onDelete={onDelete}
      />

      {/* Filter controls */}
      <Stack direction="row" spacing={2} sx={{ mb: 2, mt: selectedIds.length > 0 ? 2 : 0 }} alignItems="center">
        <ToggleButtonGroup
          value={showOnlyUnknown ? "unknown" : "all"}
          exclusive
          onChange={(_, value) => {
            if (value !== null) {
              setShowOnlyUnknown(value === "unknown");
            }
          }}
          size="small"
        >
          <ToggleButton value="unknown">
            {t("importWizard.unknownOnly")} ({unknownCount})
          </ToggleButton>
          <ToggleButton value="all">
            {t("importWizard.showAll")} ({transactions.length})
          </ToggleButton>
        </ToggleButtonGroup>

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

      {/* Transaction table */}
      <Paper>
        <AlisaDataTable<Transaction>
          t={t}
          data={filteredTransactions}
          sortable
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
          onOpen={setDetailId}
          selectedIds={selectedIds}
        />
      </Paper>

      {detailId > 0 && (
        <TransactionDetails
          id={detailId}
          onClose={() => setDetailId(0)}
        />
      )}

      {/* Navigation buttons */}
      <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
        <AlisaButton label={t("importWizard.back")} onClick={onBack} />
        <AlisaButton
          label={t("importWizard.next")}
          variant="contained"
          onClick={onNext}
          disabled={hasUnknownTypes}
        />
      </Stack>
    </Box>
  );
}
