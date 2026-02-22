import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionAcceptInput,
  TransactionSetTypeInput,
  TransactionSetCategoryTypeInput,
  SplitLoanPaymentBulkInput,
} from "@alisa-types";
import { ImportWizardState, ImportStats, ImportResponse, BankId } from "../types";
import ApiClient from "@alisa-lib/api-client";
import { transactionContext, opImportContext, sPankkiImportContext } from "@alisa-lib/alisa-contexts";
import { getTransactionPropertyId } from "@alisa-lib/initial-data";
import { TypeOrmFetchOptions } from "@alisa-lib/types";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../../TransactionLeftMenuItems";
import { useToast } from "../../../alisa";
import UserStorage from "@alisa-lib/user-storage";

const STORAGE_KEY = "importWizard:session";

interface ImportSession {
  propertyId: number;
  transactionIds: number[];
  selectedBank: BankId | null;
}

const saveSession = (session: ImportSession) => {
  UserStorage.setItem(STORAGE_KEY, session);
};

const loadSession = (): ImportSession | null => {
  return UserStorage.getItem<ImportSession>(STORAGE_KEY);
};

const clearSession = () => {
  UserStorage.removeItem(STORAGE_KEY);
};

const createEmptyStats = (): ImportStats => ({
  totalCount: 0,
  totalAmount: 0,
  byType: new Map(),
});

const initialState: ImportWizardState = {
  activeStep: 0,
  propertyId: 0,
  selectedBank: null,
  files: [],
  isUploading: false,
  uploadError: null,
  importedTransactionIds: [],
  skippedCount: 0,
  transactions: [],
  selectedIds: [],
  selectedTransactionTypes: [],
  hasUnknownTypes: false,
  isApproving: false,
  approveError: null,
  importStats: createEmptyStats(),
};

export function useImportWizard() {
  const [state, setState] = useState<ImportWizardState>(() => ({
    ...initialState,
    propertyId: getTransactionPropertyId(),
  }));
  const { t } = useTranslation();
  const { showToast } = useToast();

  // Listen for property changes from navigation
  // If property changes during an active import, reset the wizard
  useEffect(() => {
    const handlePropertyChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ propertyId: number }>;
      const newPropertyId = customEvent.detail.propertyId;

      setState((prev) => {
        // If there's an active import (transactions loaded) and property changes, reset
        if (prev.transactions.length > 0 && prev.propertyId !== newPropertyId) {
          clearSession();
          return {
            ...initialState,
            propertyId: newPropertyId,
          };
        }
        return { ...prev, propertyId: newPropertyId };
      });
    };

    window.addEventListener(TRANSACTION_PROPERTY_CHANGE_EVENT, handlePropertyChange);

    return () => {
      window.removeEventListener(TRANSACTION_PROPERTY_CHANGE_EVENT, handlePropertyChange);
    };
  }, []);

  // Restore session on mount if there's an unfinished import
  useEffect(() => {
    const restoreSession = async () => {
      const session = loadSession();
      if (!session || session.transactionIds.length === 0) return;

      // Fetch transactions and check if any are still pending
      const fetchOptions: TypeOrmFetchOptions<Transaction> = {
        select: [
          "id",
          "type",
          "transactionDate",
          "sender",
          "receiver",
          "description",
          "amount",
        ],
        relations: {
          expenses: true,
          incomes: true,
        },
        order: {
          transactionDate: "DESC",
        },
        where: {
          id: { $in: session.transactionIds },
          status: TransactionStatus.PENDING,
        },
      };

      const transactions = await ApiClient.search<Transaction>(
        transactionContext.apiPath,
        fetchOptions
      );

      if (transactions.length > 0) {
        // Resume session at Review step
        const hasUnknownTypes = transactions.some(
          (t) => t.type === TransactionType.UNKNOWN
        );
        // Use only the IDs of transactions that are still pending
        const pendingIds = transactions.map((t) => t.id);
        // Update session with current pending IDs
        saveSession({
          propertyId: session.propertyId,
          transactionIds: pendingIds,
          selectedBank: session.selectedBank,
        });
        setState((prev) => ({
          ...prev,
          activeStep: 1, // Review step
          propertyId: session.propertyId,
          selectedBank: session.selectedBank,
          importedTransactionIds: pendingIds,
          transactions,
          hasUnknownTypes,
        }));
      } else {
        // All transactions approved or deleted, clear session
        clearSession();
      }
    };

    restoreSession();
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, activeStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, activeStep: prev.activeStep + 1 }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({ ...prev, activeStep: Math.max(0, prev.activeStep - 1) }));
  }, []);

  const setFiles = useCallback((files: File[]) => {
    setState((prev) => ({ ...prev, files, uploadError: null }));
  }, []);

  const setBank = useCallback((bank: BankId) => {
    setState((prev) => ({ ...prev, selectedBank: bank }));
  }, []);

  const getImportApiPath = (bank: BankId): string => {
    switch (bank) {
      case "s-pankki":
        return sPankkiImportContext.apiPath;
      case "op":
      default:
        return opImportContext.apiPath;
    }
  };

  const uploadFiles = useCallback(async (): Promise<{ savedIds: number[]; skippedCount: number }> => {
    if (state.files.length === 0 || state.propertyId <= 0 || !state.selectedBank) {
      return { savedIds: [], skippedCount: 0 };
    }

    setState((prev) => ({ ...prev, isUploading: true, uploadError: null }));

    try {
      const allTransactionIds: number[] = [];
      let totalSkipped = 0;
      const apiPath = getImportApiPath(state.selectedBank);

      // Upload each file sequentially
      for (const file of state.files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("propertyId", state.propertyId.toString());

        const response = await ApiClient.upload<ImportResponse>(
          apiPath,
          formData as unknown as ImportResponse
        );

        const transactionIds = response.savedIds || [];
        allTransactionIds.push(...transactionIds);
        totalSkipped += response.skippedCount || 0;
      }

      // Save session for resumption if wizard is interrupted
      if (allTransactionIds.length > 0) {
        saveSession({
          propertyId: state.propertyId,
          transactionIds: allTransactionIds,
          selectedBank: state.selectedBank,
        });
        showToast({ message: t("common:toast.importSuccess", { count: allTransactionIds.length }), severity: "success" });
      }

      setState((prev) => ({
        ...prev,
        isUploading: false,
        importedTransactionIds: allTransactionIds,
        skippedCount: totalSkipped,
      }));

      return { savedIds: allTransactionIds, skippedCount: totalSkipped };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setState((prev) => ({
        ...prev,
        isUploading: false,
        uploadError: errorMessage,
      }));
      return { savedIds: [], skippedCount: 0 };
    }
  }, [state.files, state.propertyId, state.selectedBank, showToast, t]);

  const fetchTransactions = useCallback(async (ids: number[]) => {
    if (ids.length === 0) return;

    const fetchOptions: TypeOrmFetchOptions<Transaction> = {
      select: [
        "id",
        "type",
        "transactionDate",
        "sender",
        "receiver",
        "description",
        "amount",
      ],
      relations: {
        expenses: true,
        incomes: true,
      },
      order: {
        transactionDate: "DESC",
      },
      where: {
        id: { $in: ids },
        status: TransactionStatus.PENDING,
      },
    };

    const transactions = await ApiClient.search<Transaction>(
      transactionContext.apiPath,
      fetchOptions
    );

    const hasUnknownTypes = transactions.some(
      (t) => t.type === TransactionType.UNKNOWN
    );

    setState((prev) => ({
      ...prev,
      transactions,
      hasUnknownTypes,
    }));
  }, []);

  const handleSelectChange = useCallback(
    (id: number, item?: Transaction) => {
      setState((prev) => {
        if (prev.selectedIds.includes(id)) {
          const index = prev.selectedIds.indexOf(id);
          return {
            ...prev,
            selectedIds: prev.selectedIds.filter((i) => i !== id),
            selectedTransactionTypes: prev.selectedTransactionTypes.filter(
              (_, i) => i !== index
            ),
          };
        } else {
          return {
            ...prev,
            selectedIds: [...prev.selectedIds, id],
            selectedTransactionTypes: item
              ? [...prev.selectedTransactionTypes, item.type]
              : prev.selectedTransactionTypes,
          };
        }
      });
    },
    []
  );

  const handleSelectAllChange = useCallback(
    (ids: number[], items?: Transaction[]) => {
      setState((prev) => ({
        ...prev,
        selectedIds: ids,
        selectedTransactionTypes: items
          ? items.map((item) => item.type)
          : [],
      }));
    },
    []
  );

  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIds: [],
      selectedTransactionTypes: [],
    }));
  }, []);

  const setTypeForSelected = useCallback(
    async (type: number) => {
      if (state.selectedIds.length === 0 || type <= 0) return;

      await ApiClient.postSaveTask<TransactionSetTypeInput>(
        transactionContext.apiPath + "/type",
        {
          ids: state.selectedIds,
          type: type,
        }
      );

      showToast({ message: t("common:toast.typeUpdated"), severity: "success" });
      // Refetch transactions to update UI
      await fetchTransactions(state.importedTransactionIds);
      clearSelection();
    },
    [state.selectedIds, state.importedTransactionIds, fetchTransactions, clearSelection, showToast, t]
  );

  const setCategoryTypeForSelected = useCallback(
    async (expenseTypeId?: number, incomeTypeId?: number) => {
      if (state.selectedIds.length === 0) return;

      await ApiClient.postSaveTask<TransactionSetCategoryTypeInput>(
        transactionContext.apiPath + "/category-type",
        {
          ids: state.selectedIds,
          expenseTypeId,
          incomeTypeId,
        }
      );

      showToast({ message: t("common:toast.categoryUpdated"), severity: "success" });
      // Refetch transactions to update UI
      await fetchTransactions(state.importedTransactionIds);
      clearSelection();
    },
    [state.selectedIds, state.importedTransactionIds, fetchTransactions, clearSelection, showToast, t]
  );

  const splitLoanPaymentForSelected = useCallback(
    async () => {
      if (state.selectedIds.length === 0) return;

      const result = await ApiClient.postSaveTask<SplitLoanPaymentBulkInput>(
        transactionContext.apiPath + "/split-loan-payment",
        { ids: state.selectedIds }
      );

      // Helper to translate backend error messages
      const translateLoanSplitError = (message: string): string => {
        if (message === "Unauthorized") {
          return t("loanSplitErrors.unauthorized");
        }
        if (message === "Can only split pending transactions") {
          return t("loanSplitErrors.notPending");
        }
        if (message === "Transaction description does not match loan payment format") {
          return t("loanSplitErrors.notLoanFormat");
        }
        return message;
      };

      if (result.allSuccess) {
        showToast({ message: t("common:toast.loanSplit"), severity: "success" });
      } else if (result.rows?.success > 0) {
        // Partial success - show first error message from failed results
        const firstError = result.results?.find(r => r.statusCode !== 200);
        const errorMessage = firstError?.message
          ? translateLoanSplitError(firstError.message)
          : t("common:toast.partialSuccess", {
              success: result.rows.success,
              failed: result.rows.failed
            });
        showToast({
          message: errorMessage,
          severity: "warning"
        });
      } else {
        // All failed - show first error message from backend
        const firstError = result.results?.[0];
        const errorMessage = firstError?.message
          ? translateLoanSplitError(firstError.message)
          : t("common:toast.error");
        showToast({ message: errorMessage, severity: "error" });
      }

      // Refetch transactions to update UI
      await fetchTransactions(state.importedTransactionIds);
      clearSelection();
    },
    [state.selectedIds, state.importedTransactionIds, fetchTransactions, clearSelection, showToast, t]
  );

  const deleteSelected = useCallback(async () => {
    if (state.selectedIds.length === 0) return;

    const deletedCount = state.selectedIds.length;
    const result = await ApiClient.postSaveTask<TransactionAcceptInput>(
      transactionContext.apiPath + "/delete",
      {
        ids: state.selectedIds,
      }
    );

    if (result.allSuccess) {
      // Remove deleted IDs from importedTransactionIds
      const remainingIds = state.importedTransactionIds.filter(
        (id) => !state.selectedIds.includes(id)
      );

      // Update session with remaining IDs
      if (remainingIds.length > 0) {
        saveSession({
          propertyId: state.propertyId,
          transactionIds: remainingIds,
          selectedBank: state.selectedBank,
        });
      } else {
        clearSession();
      }

      showToast({ message: t("common:toast.deleteSuccessCount", { count: deletedCount }), severity: "success" });

      setState((prev) => ({
        ...prev,
        importedTransactionIds: remainingIds,
        transactions: prev.transactions.filter(
          (tx) => !state.selectedIds.includes(tx.id)
        ),
        hasUnknownTypes: prev.transactions
          .filter((tx) => !state.selectedIds.includes(tx.id))
          .some((tx) => tx.type === TransactionType.UNKNOWN),
      }));

      clearSelection();
    }
  }, [state.selectedIds, state.importedTransactionIds, state.propertyId, state.selectedBank, clearSelection, showToast, t]);

  const approveAll = useCallback(async (): Promise<boolean> => {
    if (state.importedTransactionIds.length === 0) return false;

    const approvedCount = state.importedTransactionIds.length;
    setState((prev) => ({ ...prev, isApproving: true, approveError: null }));

    try {
      const result = await ApiClient.postSaveTask<TransactionAcceptInput>(
        transactionContext.apiPath + "/accept",
        {
          ids: state.importedTransactionIds,
        }
      );

      if (!result.allSuccess) {
        setState((prev) => ({
          ...prev,
          isApproving: false,
          approveError: "Some transactions could not be approved",
        }));
        return false;
      }

      // Calculate stats before moving to done step
      const stats = calculateStats(state.transactions);

      // Clear session since import is complete
      clearSession();

      showToast({ message: t("common:toast.approveSuccess", { count: approvedCount }), severity: "success" });

      setState((prev) => ({
        ...prev,
        isApproving: false,
        importStats: stats,
      }));

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Approval failed";
      setState((prev) => ({
        ...prev,
        isApproving: false,
        approveError: errorMessage,
      }));
      return false;
    }
  }, [state.importedTransactionIds, state.transactions, showToast, t]);

  const reset = useCallback(() => {
    clearSession();
    setState({
      ...initialState,
      propertyId: getTransactionPropertyId(),
    });
  }, []);

  const refreshTransactions = useCallback(async () => {
    if (state.importedTransactionIds.length > 0) {
      await fetchTransactions(state.importedTransactionIds);
    }
  }, [state.importedTransactionIds, fetchTransactions]);

  return {
    state,
    goToStep,
    nextStep,
    prevStep,
    setFiles,
    setBank,
    uploadFiles,
    fetchTransactions,
    handleSelectChange,
    handleSelectAllChange,
    clearSelection,
    setTypeForSelected,
    setCategoryTypeForSelected,
    splitLoanPaymentForSelected,
    deleteSelected,
    approveAll,
    reset,
    refreshTransactions,
  };
}

function calculateStats(transactions: Transaction[]): ImportStats {
  const stats: ImportStats = {
    totalCount: transactions.length,
    totalAmount: 0,
    byType: new Map(),
  };

  for (const transaction of transactions) {
    stats.totalAmount += transaction.amount;

    const typeStats = stats.byType.get(transaction.type) || {
      count: 0,
      amount: 0,
    };
    typeStats.count++;
    typeStats.amount += transaction.amount;
    stats.byType.set(transaction.type, typeStats);
  }

  return stats;
}
