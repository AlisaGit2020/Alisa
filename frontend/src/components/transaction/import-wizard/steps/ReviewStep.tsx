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
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { TFunction } from "i18next";
import { Transaction, TransactionType, AllocationResult } from "@alisa-types";
import AlisaDataTable from "../../../alisa/datatable/AlisaDataTable";
import TransactionsPendingActions from "../../pending/TransactionsPendingActions";
import TransactionDetails from "../../components/TransactionDetails";
import { AllocationRulesModal } from "../../../allocation";
import { useState, useMemo, useCallback } from "react";
import axios from "axios";
import ApiClient from "@alisa-lib/api-client";
import { useToast } from "../../../alisa/toast/AlisaToastProvider";

type SearchField = "all" | "sender" | "receiver" | "description" | "amount";

interface TransactionRow extends Transaction {
  categoryName: string;
}

interface ReviewStepProps {
  t: TFunction;
  propertyId: number;
  propertyName?: string;
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
  onResetAllocation: () => Promise<void>;
  onSplitLoanPayment: () => Promise<void>;
  onDelete: () => Promise<void>;
  onNext: () => void;
  onBack: () => void;
  onRefresh?: () => Promise<void>;
}

export default function ReviewStep({
  t,
  propertyId,
  propertyName,
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
  onResetAllocation,
  onSplitLoanPayment,
  onDelete,
  onNext,
  onBack,
  onRefresh,
}: ReviewStepProps) {
  const { showToast } = useToast();
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");
  const [showOnlyUnknown, setShowOnlyUnknown] = useState(true);
  const [detailId, setDetailId] = useState<number>(0);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [conflictingIds, setConflictingIds] = useState<Set<number>>(new Set());

  // Filter transactions based on unknown/allocated filter, search text, and selected field
  const filteredTransactions = useMemo((): TransactionRow[] => {
    // Helper function to get category name from transaction
    const getCategoryName = (tx: Transaction): string => {
      if (tx.type === TransactionType.EXPENSE && tx.expenses?.[0]?.expenseType) {
        return t(`expense-type:${tx.expenses[0].expenseType.key}`);
      }
      if (tx.type === TransactionType.INCOME && tx.incomes?.[0]?.incomeType) {
        return t(`income-type:${tx.incomes[0].incomeType.key}`);
      }
      return "";
    };

    let filtered = transactions;

    // Filter by unknown/allocated toggle
    if (showOnlyUnknown) {
      filtered = filtered.filter((tx) => tx.type === TransactionType.UNKNOWN);
    } else {
      // "Allocated" view - show transactions that have a type set (not UNKNOWN)
      filtered = filtered.filter((tx) => tx.type !== TransactionType.UNKNOWN);
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

    // Add categoryName to each transaction
    return filtered.map((tx) => ({
      ...tx,
      categoryName: getCategoryName(tx),
    }));
  }, [transactions, searchText, searchField, showOnlyUnknown, t]);

  // Count unknown transactions
  const unknownCount = useMemo(() => {
    return transactions.filter((tx) => tx.type === TransactionType.UNKNOWN).length;
  }, [transactions]);

  const handleSetType = async (type: number) => {
    await onSetType(type);
    // Clear search to show remaining unknown rows
    setSearchText("");
  };

  const handleResetAllocation = async () => {
    await onResetAllocation();
    setSearchText("");
  };

  const handleSetCategoryType = async (
    expenseTypeId?: number,
    incomeTypeId?: number
  ) => {
    await onSetCategoryType(expenseTypeId, incomeTypeId);
  };

  const handleSplitLoanPayment = async () => {
    await onSplitLoanPayment();
    // Clear search to show remaining unknown rows
    setSearchText("");
  };

  const handleCancel = () => {
    onClearSelection();
  };

  const handleAutoAllocate = useCallback(async () => {
    if (!propertyId) return;

    // Get IDs of unknown transactions
    const unknownTransactions = transactions.filter(
      (tx) => tx.type === TransactionType.UNKNOWN
    );

    if (unknownTransactions.length === 0) {
      showToast({ message: t("allocation:noTransactionsSelected"), severity: "info" });
      return;
    }

    setIsAllocating(true);
    try {
      const options = await ApiClient.getOptions();
      const response = await axios.post<AllocationResult>(
        `${import.meta.env.VITE_API_URL}/allocation-rules/apply`,
        {
          propertyId,
          transactionIds: unknownTransactions.map((tx) => tx.id),
        },
        options
      );

      const result = response.data;

      // Track conflicting transactions
      if (result.conflicting.length > 0) {
        setConflictingIds(new Set(result.conflicting.map((c) => c.transactionId)));
      }

      // Show results
      if (result.allocated.length > 0) {
        showToast({ message: t("allocation:allocatedCount", { count: result.allocated.length }), severity: "success" });

        // Deselect successfully allocated transactions
        const allocatedIds = new Set(result.allocated.map((a) => a.transactionId));
        const remainingSelectedIds = selectedIds.filter((id) => !allocatedIds.has(id));
        onSelectAllChange(remainingSelectedIds);

        // Refresh transactions to show updated types
        if (onRefresh) {
          await onRefresh();
        }
      }

      if (result.conflicting.length > 0) {
        showToast({ message: t("allocation:conflictingCount", { count: result.conflicting.length }), severity: "warning" });
      }

      // Show info message when no matches found
      if (result.allocated.length === 0 && result.conflicting.length === 0) {
        showToast({ message: t("allocation:noMatchesFound"), severity: "info" });
      }

      // Clear search to see results
      setSearchText("");
    } catch (error) {
      console.error("Auto-allocate failed:", error);
      showToast({ message: t("common:toast.error"), severity: "error" });
    } finally {
      setIsAllocating(false);
    }
  }, [propertyId, transactions, t, showToast, onRefresh, selectedIds, onSelectAllChange]);

  const hasExpenseTransactions = selectedTransactionTypes.includes(
    TransactionType.EXPENSE
  );
  const hasIncomeTransactions = selectedTransactionTypes.includes(
    TransactionType.INCOME
  );

  // Check if any unknown transactions exist for the auto-allocate button
  const hasUnknownTransactions = transactions.some(
    (tx) => tx.type === TransactionType.UNKNOWN
  );

  // Check if any selected transactions are allocated (not UNKNOWN)
  const hasAllocatedSelected = selectedIds.some((id) => {
    const tx = transactions.find((t) => t.id === id);
    return tx && tx.type !== TransactionType.UNKNOWN;
  });

  // Check if any selected transactions are not allocated (UNKNOWN)
  const hasUnallocatedSelected = selectedIds.some((id) => {
    const tx = transactions.find((t) => t.id === id);
    return tx && tx.type === TransactionType.UNKNOWN;
  });

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
        onOpenAllocationRules={() => setRulesModalOpen(true)}
        onAutoAllocate={handleAutoAllocate}
        autoAllocateDisabled={!hasUnknownTransactions || !propertyId}
        isAllocating={isAllocating}
        onResetAllocation={handleResetAllocation}
        hasAllocatedSelected={hasAllocatedSelected}
        hasUnallocatedSelected={hasUnallocatedSelected}
      />

      {/* Filter controls */}
      <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 2 }} alignItems="center">
        <ToggleButtonGroup
          value={showOnlyUnknown ? "unknown" : "allocated"}
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
          <ToggleButton value="allocated">
            <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
            {t("allocation:allocated")} ({transactions.length - unknownCount})
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
        <AlisaDataTable<TransactionRow>
          t={t}
          data={filteredTransactions}
          sortable
          fields={[
            {
              name: "type",
              format: "transactionType",
              label: "",
            },
            { name: "categoryName", label: t("category"), hideOnMobile: true },
            { name: "transactionDate", format: "date" },
            { name: "sender", maxLength: 20, hideOnMobile: true },
            { name: "receiver", maxLength: 20, hideOnMobile: true },
            { name: "description", maxLength: 30, hideOnMobile: true },
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

      {/* Allocation Rules Modal */}
      {propertyId > 0 && (
        <AllocationRulesModal
          open={rulesModalOpen}
          propertyId={propertyId}
          propertyName={propertyName}
          onClose={() => setRulesModalOpen(false)}
        />
      )}

      {/* Conflict indicator tooltip for rows with conflicts */}
      {conflictingIds.size > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningAmberIcon fontSize="small" />
            <span>{t("allocation:conflictingCount", { count: conflictingIds.size })}</span>
          </Stack>
        </Alert>
      )}
    </Box>
  );
}
