import { useState, useCallback, useEffect } from "react";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionAcceptInput,
  TransactionSetTypeInput,
  TransactionSetCategoryTypeInput,
} from "@alisa-types";
import { ImportWizardState, ImportStats, ImportResponse } from "../types";
import ApiClient from "@alisa-lib/api-client";
import { transactionContext, opImportContext } from "@alisa-lib/alisa-contexts";
import { getTransactionPropertyId } from "@alisa-lib/initial-data";
import { TypeOrmFetchOptions } from "@alisa-lib/types";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../../TransactionLeftMenuItems";

// Session persistence for resuming interrupted imports
const STORAGE_KEY = "importWizard:session";

interface ImportSession {
  propertyId: number;
  transactionIds: number[];
}

const saveSession = (session: ImportSession) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

const loadSession = (): ImportSession | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const createEmptyStats = (): ImportStats => ({
  totalCount: 0,
  totalAmount: 0,
  byType: new Map(),
});

const initialState: ImportWizardState = {
  activeStep: 0,
  propertyId: 0,
  file: null,
  isUploading: false,
  uploadError: null,
  importedTransactionIds: [],
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

  // Listen for property changes from navigation
  useEffect(() => {
    const handlePropertyChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ propertyId: number }>;
      const propertyId = customEvent.detail.propertyId;
      setState((prev) => ({ ...prev, propertyId }));
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
        saveSession({ propertyId: session.propertyId, transactionIds: pendingIds });
        setState((prev) => ({
          ...prev,
          activeStep: 1, // Review step
          propertyId: session.propertyId,
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

  const setFile = useCallback((file: File | null) => {
    setState((prev) => ({ ...prev, file, uploadError: null }));
  }, []);

  const uploadFile = useCallback(async (): Promise<number[]> => {
    if (!state.file || state.propertyId <= 0) return [];

    setState((prev) => ({ ...prev, isUploading: true, uploadError: null }));

    try {
      const formData = new FormData();
      formData.append("file", state.file);
      formData.append("propertyId", state.propertyId.toString());

      const response = await ApiClient.upload<ImportResponse>(
        opImportContext.apiPath,
        formData as unknown as ImportResponse
      );

      const transactionIds = response.data || [];

      // Save session for resumption if wizard is interrupted
      if (transactionIds.length > 0) {
        saveSession({ propertyId: state.propertyId, transactionIds });
      }

      setState((prev) => ({
        ...prev,
        isUploading: false,
        importedTransactionIds: transactionIds,
      }));

      return transactionIds;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setState((prev) => ({
        ...prev,
        isUploading: false,
        uploadError: errorMessage,
      }));
      return [];
    }
  }, [state.file, state.propertyId]);

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

      // Refetch transactions to update UI
      await fetchTransactions(state.importedTransactionIds);
      clearSelection();
    },
    [state.selectedIds, state.importedTransactionIds, fetchTransactions, clearSelection]
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

      // Refetch transactions to update UI
      await fetchTransactions(state.importedTransactionIds);
      clearSelection();
    },
    [state.selectedIds, state.importedTransactionIds, fetchTransactions, clearSelection]
  );

  const deleteSelected = useCallback(async () => {
    if (state.selectedIds.length === 0) return;

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
        saveSession({ propertyId: state.propertyId, transactionIds: remainingIds });
      } else {
        clearSession();
      }

      setState((prev) => ({
        ...prev,
        importedTransactionIds: remainingIds,
        transactions: prev.transactions.filter(
          (t) => !state.selectedIds.includes(t.id)
        ),
        hasUnknownTypes: prev.transactions
          .filter((t) => !state.selectedIds.includes(t.id))
          .some((t) => t.type === TransactionType.UNKNOWN),
      }));

      clearSelection();
    }
  }, [state.selectedIds, state.importedTransactionIds, state.propertyId, clearSelection]);

  const approveAll = useCallback(async (): Promise<boolean> => {
    if (state.importedTransactionIds.length === 0) return false;

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
  }, [state.importedTransactionIds, state.transactions]);

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
    setFile,
    uploadFile,
    fetchTransactions,
    handleSelectChange,
    handleSelectAllChange,
    clearSelection,
    setTypeForSelected,
    setCategoryTypeForSelected,
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
