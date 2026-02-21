import { Box, Paper, Stack } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import AlisaDataTable from "../../alisa/datatable/AlisaDataTable";
import { incomeContext } from "@alisa-lib/alisa-contexts";
import { Income } from "@alisa-types";
import DataService from "@alisa-lib/data-service";
import { TypeOrmFetchOptions } from "@alisa-lib/types";
import React, { useState, useEffect, useMemo } from "react";
import { ListPageTemplate } from "../../templates";
import IncomeForm from "./IncomeForm";
import AccountingFilter, { AccountingFilterData } from "../AccountingFilter";
import {
  getStoredFilter,
  setStoredFilter,
  getTransactionPropertyId,
} from "@alisa-lib/initial-data";
import { View } from "@alisa-lib/views";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../../transaction/TransactionLeftMenuItems";
import { usePropertyRequired } from "@alisa-lib/hooks/usePropertyRequired";
import { PropertyRequiredSnackbar } from "../../alisa/PropertyRequiredSnackbar";
import BulkDeleteActions from "../../alisa/BulkDeleteActions";
import ApiClient from "@alisa-lib/api-client";
import { useToast } from "../../alisa";
import AlisaConfirmDialog from "../../alisa/dialog/AlisaConfirmDialog";

const getDefaultFilter = (): AccountingFilterData => ({
  typeIds: [],
  searchText: "",
  startDate: null,
  endDate: null,
});

interface IncomeRow {
  id: number;
  accountingDate: Date | null;
  incomeTypeName: string;
  description: string;
  quantity: number;
  amount: number;
  totalAmount: number;
  transactionId: number | null;
}

function Incomes({ t }: WithTranslation) {
  const [propertyId, setPropertyId] = useState<number>(() =>
    getTransactionPropertyId()
  );
  const [filter, setFilter] = useState<AccountingFilterData>(() => {
    const stored = getStoredFilter<AccountingFilterData>(View.INCOMES);
    return stored || getDefaultFilter();
  });
  const [editId, setEditId] = useState<number | undefined>(undefined);
  const [addNew, setAddNew] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [incomeData, setIncomeData] = useState<IncomeRow[]>([]);
  const [transactionWarningOpen, setTransactionWarningOpen] = useState(false);
  const [itemsWithTransaction, setItemsWithTransaction] = useState<IncomeRow[]>([]);
  const [deletableIds, setDeletableIds] = useState<number[]>([]);
  const [singleDeleteWarningOpen, setSingleDeleteWarningOpen] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<number | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const { showToast } = useToast();

  const { requireProperty, popoverOpen, popoverAnchorEl, closePopover, openPropertySelector } =
    usePropertyRequired(propertyId);

  // Listen for global property changes
  useEffect(() => {
    const handlePropertyChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ propertyId: number }>;
      setPropertyId(customEvent.detail.propertyId);
      setRefreshTrigger((prev) => prev + 1);
    };

    window.addEventListener(
      TRANSACTION_PROPERTY_CHANGE_EVENT,
      handlePropertyChange
    );

    return () => {
      window.removeEventListener(
        TRANSACTION_PROPERTY_CHANGE_EVENT,
        handlePropertyChange
      );
    };
  }, []);

  const updateFilter = (newFilter: AccountingFilterData) => {
    setFilter(newFilter);
    setStoredFilter(View.INCOMES, newFilter);
    setRefreshTrigger((prev) => prev + 1);
  };

  const fetchOptions: TypeOrmFetchOptions<Income> = useMemo(() => {
    const getDateFilter = () => {
      if (filter.startDate && filter.endDate) {
        return { $between: [filter.startDate, filter.endDate] };
      }
      if (filter.startDate) {
        return { $gte: filter.startDate };
      }
      if (filter.endDate) {
        return { $lte: filter.endDate };
      }
      return undefined;
    };

    return {
      relations: {
        incomeType: true,
        property: true,
      },
      order: {
        accountingDate: "DESC",
        id: "DESC",
      },
      where: {
        propertyId: propertyId > 0 ? propertyId : undefined,
        incomeTypeId:
          filter.typeIds.length > 0 ? { $in: filter.typeIds } : undefined,
        description: filter.searchText
          ? { $ilike: `%${filter.searchText}%` }
          : undefined,
        accountingDate: getDateFilter(),
      },
    };
  }, [propertyId, filter.typeIds, filter.searchText, filter.startDate, filter.endDate]);

  const dataService = useMemo(
    () => new DataService<Income>({ context: incomeContext, fetchOptions }),
    [fetchOptions]
  );

  const handleTypeChange = (typeIds: number[]) => {
    updateFilter({ ...filter, typeIds });
  };

  const handleSearchTextChange = (searchText: string) => {
    updateFilter({ ...filter, searchText });
  };

  const handleStartDateChange = (startDate: Date | null) => {
    updateFilter({ ...filter, startDate });
  };

  const handleEndDateChange = (endDate: Date | null) => {
    updateFilter({ ...filter, endDate });
  };

  const handleReset = () => {
    updateFilter(getDefaultFilter());
  };

  const handleOpenDetails = (id: number) => {
    setEditId(id);
  };

  const handleAdd = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (!requireProperty(event)) return;
    setAddNew(true);
  };

  const handleFormClose = () => {
    setEditId(undefined);
    setAddNew(false);
  };

  const handleAfterSubmit = () => {
    setEditId(undefined);
    setAddNew(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectChange = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllChange = (ids: number[]) => {
    setSelectedIds(ids);
  };

  const handleCancelSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 || isDeleting) return;

    // Pre-check: identify items with transaction relations
    const selectedIncomes = incomeData.filter((i) => selectedIds.includes(i.id));
    const withTransaction = selectedIncomes.filter((i) => i.transactionId !== null);
    const withoutTransaction = selectedIncomes.filter((i) => i.transactionId === null);
    const deletableIdsToProcess = withoutTransaction.map((i) => i.id);

    // If some items have transactions, show warning dialog (which also acts as confirmation)
    if (withTransaction.length > 0) {
      setItemsWithTransaction(withTransaction);
      setDeletableIds(deletableIdsToProcess);
      setTransactionWarningOpen(true);
      // Deselect items with transactions
      setSelectedIds(deletableIdsToProcess);
      return;
    }

    // All items are deletable - show confirmation dialog
    setBulkDeleteConfirmOpen(true);
  };

  const performBulkDelete = async (idsToDelete: number[]) => {
    if (idsToDelete.length === 0) {
      showToast({
        message: t("accounting:noItemsToDelete"),
        severity: "info",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const result = await ApiClient.postSaveTask("accounting/income/delete", {
        ids: idsToDelete,
      });
      if (result.allSuccess) {
        showToast({
          message: t("common:toast.deleteSuccess"),
          severity: "success",
        });
      } else {
        showToast({
          message: t("common:toast.partialSuccess", {
            success: result.rows.success,
            failed: result.rows.failed,
          }),
          severity: "warning",
        });
      }
      setSelectedIds([]);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting incomes:", error);
      showToast({
        message: t("common:toast.error"),
        severity: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTransactionWarningConfirm = async () => {
    setTransactionWarningOpen(false);
    await performBulkDelete(deletableIds);
  };

  const handleTransactionWarningClose = () => {
    setTransactionWarningOpen(false);
    setItemsWithTransaction([]);
    setDeletableIds([]);
  };

  const handleSingleDeleteRequest = (id: number) => {
    const income = incomeData.find((i) => i.id === id);
    if (!income || income.transactionId !== null) {
      setSingleDeleteWarningOpen(true);
      return;
    }
    // Show confirmation dialog
    setSingleDeleteId(id);
    setSingleDeleteConfirmOpen(true);
  };

  const performSingleDelete = async (id: number) => {
    try {
      await dataService.delete(id);
      showToast({ message: t("common:toast.deleteSuccess"), severity: "success" });
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting income:", error);
      showToast({ message: t("common:toast.deleteError"), severity: "error" });
    }
  };

  const handleSingleDeleteWarningClose = () => {
    setSingleDeleteWarningOpen(false);
  };

  const handleSingleDeleteConfirm = async () => {
    if (singleDeleteId !== null) {
      await performSingleDelete(singleDeleteId);
    }
    setSingleDeleteConfirmOpen(false);
    setSingleDeleteId(null);
  };

  const handleSingleDeleteConfirmClose = () => {
    setSingleDeleteConfirmOpen(false);
    setSingleDeleteId(null);
  };

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleteConfirmOpen(false);
    await performBulkDelete(selectedIds);
  };

  const handleBulkDeleteConfirmClose = () => {
    setBulkDeleteConfirmOpen(false);
  };

  // Create a simple data service wrapper for the transformed data
  // Include refreshTrigger in dependencies to force refresh after form submit
  const rowDataService = useMemo(() => {
    const service = {
      search: async () => {
        const incomes = await dataService.search();
        const rows = incomes.map((income) => ({
          id: income.id,
          accountingDate: income.accountingDate || null,
          incomeTypeName: income.incomeType?.name || "",
          description: income.description,
          quantity: income.quantity,
          amount: income.amount,
          totalAmount: income.totalAmount,
          transactionId: income.transactionId,
        }));
        setIncomeData(rows);
        return rows;
      },
      delete: async (id: number) => {
        await dataService.delete(id);
      },
    } as DataService<IncomeRow>;
    return service;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataService, refreshTrigger]);

  return (
    <ListPageTemplate
      translationPrefix="accounting"
      titleKey="incomesPageTitle"
      descriptionKey="incomesPageDescription"
      moreDetailsKey="incomesPageMoreDetails"
    >
      <Stack spacing={2}>
        <BulkDeleteActions
          t={t}
          open={selectedIds.length > 0}
          selectedCount={selectedIds.length}
          onCancel={handleCancelSelection}
          onDelete={handleBulkDelete}
          isDeleting={isDeleting}
        />

        <Box sx={{ display: selectedIds.length === 0 ? "block" : "none" }}>
          <AccountingFilter
            mode="income"
            data={filter}
            onTypeChange={handleTypeChange}
            onSearchTextChange={handleSearchTextChange}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onReset={handleReset}
          />
        </Box>

        <Paper>
          <AlisaDataTable<IncomeRow>
            t={t}
            dataService={rowDataService}
            sortable
            fields={[
              { name: "accountingDate", format: "date" },
              { name: "incomeTypeName", label: t("incomeType") },
              { name: "description", maxLength: 40 },
              { name: "quantity", format: "number" },
              { name: "amount", format: "currency" },
              { name: "totalAmount", format: "currency", sum: true },
            ]}
            selectedIds={selectedIds}
            onSelectChange={handleSelectChange}
            onSelectAllChange={handleSelectAllChange}
            onNewRow={handleAdd}
            onOpen={handleOpenDetails}
            onEdit={handleOpenDetails}
            onDeleteRequest={handleSingleDeleteRequest}
            refreshTrigger={refreshTrigger}
          />
        </Paper>
      </Stack>

      {(editId !== undefined || addNew) && (
        <IncomeForm
          id={editId}
          propertyId={propertyId > 0 ? propertyId : undefined}
          defaultIncomeTypeId={filter.typeIds.length === 1 ? filter.typeIds[0] : undefined}
          onClose={handleFormClose}
          onAfterSubmit={handleAfterSubmit}
          onCancel={handleFormClose}
        />
      )}

      <PropertyRequiredSnackbar
        open={popoverOpen}
        anchorEl={popoverAnchorEl}
        onClose={closePopover}
        onSelectProperty={openPropertySelector}
      />

      {transactionWarningOpen && deletableIds.length > 0 && (
        <AlisaConfirmDialog
          title={t("accounting:cannotDeleteWithTransaction")}
          contentText={t("accounting:someItemsHaveTransactions", {
            count: itemsWithTransaction.length,
            deletableCount: deletableIds.length,
          })}
          buttonTextConfirm={t("common:delete")}
          buttonTextCancel={t("common:close")}
          open={transactionWarningOpen}
          onConfirm={handleTransactionWarningConfirm}
          onClose={handleTransactionWarningClose}
        />
      )}

      {transactionWarningOpen && deletableIds.length === 0 && (
        <AlisaConfirmDialog
          title={t("accounting:cannotDeleteWithTransaction")}
          contentText={t("accounting:allItemsHaveTransactions", {
            count: itemsWithTransaction.length,
          })}
          buttonTextConfirm={t("common:ok")}
          buttonTextCancel={t("common:close")}
          open={transactionWarningOpen}
          onConfirm={handleTransactionWarningClose}
          onClose={handleTransactionWarningClose}
        />
      )}

      {singleDeleteWarningOpen && (
        <AlisaConfirmDialog
          title={t("accounting:cannotDeleteWithTransaction")}
          contentText={t("accounting:singleItemHasTransaction")}
          buttonTextConfirm={t("common:ok")}
          buttonTextCancel={t("common:close")}
          open={singleDeleteWarningOpen}
          onConfirm={handleSingleDeleteWarningClose}
          onClose={handleSingleDeleteWarningClose}
        />
      )}

      {singleDeleteConfirmOpen && (
        <AlisaConfirmDialog
          title={t("common:confirm")}
          contentText={t("common:confirmDelete")}
          buttonTextConfirm={t("common:delete")}
          buttonTextCancel={t("common:cancel")}
          open={singleDeleteConfirmOpen}
          onConfirm={handleSingleDeleteConfirm}
          onClose={handleSingleDeleteConfirmClose}
        />
      )}

      {bulkDeleteConfirmOpen && (
        <AlisaConfirmDialog
          title={t("common:confirm")}
          contentText={t("common:confirmDeleteSelected", { count: selectedIds.length })}
          buttonTextConfirm={t("common:delete")}
          buttonTextCancel={t("common:cancel")}
          open={bulkDeleteConfirmOpen}
          onConfirm={handleBulkDeleteConfirm}
          onClose={handleBulkDeleteConfirmClose}
        />
      )}
    </ListPageTemplate>
  );
}

export default withTranslation("accounting")(Incomes);
