import { useState, useCallback } from "react";
import { TFunction } from "i18next";

export interface DeletePreValidationItem {
  id: number;
  transactionId: number | null;
}

interface UseDeletePreValidationOptions<T extends DeletePreValidationItem> {
  data: T[];
  showToast: (options: { message: string; severity: "success" | "error" | "info" | "warning" }) => void;
  t: TFunction;
  onDelete: (id: number) => Promise<void>;
  onBulkDelete: (ids: number[]) => Promise<void>;
  onRefresh: () => void;
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
}

interface UseDeletePreValidationReturn<T extends DeletePreValidationItem> {
  // Single delete
  handleSingleDeleteRequest: (id: number) => void;
  singleDeleteWarningOpen: boolean;
  singleDeleteConfirmOpen: boolean;
  handleSingleDeleteWarningClose: () => void;
  handleSingleDeleteConfirm: () => Promise<void>;
  handleSingleDeleteConfirmClose: () => void;

  // Bulk delete
  handleBulkDelete: () => Promise<void>;
  transactionWarningOpen: boolean;
  itemsWithTransaction: T[];
  deletableIds: number[];
  bulkDeleteConfirmOpen: boolean;
  handleTransactionWarningConfirm: () => Promise<void>;
  handleTransactionWarningClose: () => void;
  handleBulkDeleteConfirm: () => Promise<void>;
  handleBulkDeleteConfirmClose: () => void;
}

export function useDeletePreValidation<T extends DeletePreValidationItem>({
  data,
  showToast,
  t,
  onDelete,
  onBulkDelete,
  onRefresh,
  selectedIds,
  setSelectedIds,
}: UseDeletePreValidationOptions<T>): UseDeletePreValidationReturn<T> {
  // Single delete state
  const [singleDeleteWarningOpen, setSingleDeleteWarningOpen] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<number | null>(null);

  // Bulk delete state
  const [transactionWarningOpen, setTransactionWarningOpen] = useState(false);
  const [itemsWithTransaction, setItemsWithTransaction] = useState<T[]>([]);
  const [deletableIds, setDeletableIds] = useState<number[]>([]);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Single delete handlers
  const handleSingleDeleteRequest = useCallback(
    (id: number) => {
      const item = data.find((i) => i.id === id);
      if (!item) {
        // Item not found in local data - show warning as defensive behavior
        setSingleDeleteWarningOpen(true);
        return;
      }
      if (item.transactionId !== null) {
        setSingleDeleteWarningOpen(true);
        return;
      }
      // Show confirmation dialog
      setSingleDeleteId(id);
      setSingleDeleteConfirmOpen(true);
    },
    [data]
  );

  const handleSingleDeleteWarningClose = useCallback(() => {
    setSingleDeleteWarningOpen(false);
  }, []);

  const handleSingleDeleteConfirm = useCallback(async () => {
    if (singleDeleteId !== null) {
      try {
        await onDelete(singleDeleteId);
        showToast({ message: t("common:toast.deleteSuccess"), severity: "success" });
        onRefresh();
      } catch (error) {
        console.error("Error deleting item:", error);
        showToast({ message: t("common:toast.deleteError"), severity: "error" });
      }
    }
    setSingleDeleteConfirmOpen(false);
    setSingleDeleteId(null);
  }, [singleDeleteId, onDelete, showToast, t, onRefresh]);

  const handleSingleDeleteConfirmClose = useCallback(() => {
    setSingleDeleteConfirmOpen(false);
    setSingleDeleteId(null);
  }, []);

  // Bulk delete handlers
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    // Pre-check: identify items with transaction relations
    const selectedItems = data.filter((item) => selectedIds.includes(item.id));
    const withTransaction = selectedItems.filter((item) => item.transactionId !== null);
    const withoutTransaction = selectedItems.filter((item) => item.transactionId === null);
    const deletableIdsToProcess = withoutTransaction.map((item) => item.id);

    // If some items have transactions, show warning dialog (which also acts as confirmation)
    if (withTransaction.length > 0) {
      setItemsWithTransaction(withTransaction as T[]);
      setDeletableIds(deletableIdsToProcess);
      setTransactionWarningOpen(true);
      // Deselect items with transactions
      setSelectedIds(deletableIdsToProcess);
      return;
    }

    // All items are deletable - show confirmation dialog
    setBulkDeleteConfirmOpen(true);
  }, [selectedIds, data, setSelectedIds]);

  const handleTransactionWarningConfirm = useCallback(async () => {
    setTransactionWarningOpen(false);
    if (deletableIds.length > 0) {
      await onBulkDelete(deletableIds);
    } else {
      showToast({
        message: t("accounting:noItemsToDelete"),
        severity: "info",
      });
    }
  }, [deletableIds, onBulkDelete, showToast, t]);

  const handleTransactionWarningClose = useCallback(() => {
    setTransactionWarningOpen(false);
    setItemsWithTransaction([]);
    setDeletableIds([]);
  }, []);

  const handleBulkDeleteConfirm = useCallback(async () => {
    setBulkDeleteConfirmOpen(false);
    await onBulkDelete(selectedIds);
  }, [selectedIds, onBulkDelete]);

  const handleBulkDeleteConfirmClose = useCallback(() => {
    setBulkDeleteConfirmOpen(false);
  }, []);

  return {
    // Single delete
    handleSingleDeleteRequest,
    singleDeleteWarningOpen,
    singleDeleteConfirmOpen,
    handleSingleDeleteWarningClose,
    handleSingleDeleteConfirm,
    handleSingleDeleteConfirmClose,

    // Bulk delete
    handleBulkDelete,
    transactionWarningOpen,
    itemsWithTransaction,
    deletableIds,
    bulkDeleteConfirmOpen,
    handleTransactionWarningConfirm,
    handleTransactionWarningClose,
    handleBulkDeleteConfirm,
    handleBulkDeleteConfirmClose,
  };
}
