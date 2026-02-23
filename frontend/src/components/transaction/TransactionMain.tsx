import { Stack } from "@mui/material";
import { transactionContext } from "@asset-lib/asset-contexts";
import Transactions from "./Transactions";
import { withTranslation, WithTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { ListPageTemplate } from "../templates";
import TransactionFilter, {
  SearchField,
  TransactionFilterData,
} from "./components/TransactionFilter";
import { TransactionAcceptInput, TransactionType } from "@asset-types";
import TransactionsAcceptedActions from "./accepted/TransactionsAcceptedActions";
import ApiClient from "@asset-lib/api-client";
import { useToast } from "../asset";
import {
  getStoredFilter,
  setStoredFilter,
  getTransactionPropertyId,
} from "@asset-lib/initial-data";
import { View } from "@asset-lib/views";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "./TransactionLeftMenuItems";

const getDefaultFilter = (): TransactionFilterData => ({
  propertyId: 0,
  transactionTypes: [],
  startDate: null,
  endDate: null,
  searchText: "",
  searchField: "sender",
});

function TransactionMain({ t }: WithTranslation) {
  // Always use the global property selection from AppBar
  const globalPropertyId = getTransactionPropertyId();

  const [filter, setFilter] = useState<TransactionFilterData>(() => {
    const stored = getStoredFilter<TransactionFilterData>(
      View.TRANSACTION_APPROVED
    );
    if (stored) {
      return { ...stored, propertyId: globalPropertyId };
    }
    return { ...getDefaultFilter(), propertyId: globalPropertyId };
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const updateFilter = (newFilter: TransactionFilterData) => {
    setFilter(newFilter);
    setStoredFilter(View.TRANSACTION_APPROVED, newFilter);
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const handlePropertyChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ propertyId: number }>;
      const propertyId = customEvent.detail.propertyId;
      updateFilter({ ...filter, propertyId });
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
     
  }, [filter]);

  const handleSelectTransactionTypes = (
    transactionTypes: TransactionType[]
  ) => {
    updateFilter({ ...filter, transactionTypes });
  };

  const handleStartDateChange = (startDate: Date | null) => {
    updateFilter({ ...filter, startDate });
  };

  const handleEndDateChange = (endDate: Date | null) => {
    updateFilter({ ...filter, endDate });
  };

  const handleSearchTextChange = (searchText: string) => {
    updateFilter({ ...filter, searchText });
  };

  const handleSearchFieldChange = (searchField: SearchField) => {
    updateFilter({ ...filter, searchField });
  };

  const handleReset = () => {
    updateFilter({ ...getDefaultFilter(), propertyId: filter.propertyId });
  };

  const handleSelectChange = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllChange = (ids: number[]) => {
    setSelectedIds(ids);
  };

  const handleCancelSelected = () => {
    setSelectedIds([]);
  };

  const handleRowDeleted = (id: number) => {
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0 || isDeleting) return;

    setIsDeleting(true);

    try {
      const result = await ApiClient.postSaveTask<TransactionAcceptInput>(
        transactionContext.apiPath + "/delete",
        { ids: selectedIds }
      );
      if (result.allSuccess) {
        showToast({ message: t("common:toast.deleteSuccessCount", { count: selectedIds.length }), severity: "success" });
        setSelectedIds([]);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showToast({ message: t("common:toast.deleteError"), severity: "error" });
      }
    } catch {
      showToast({ message: t("common:toast.deleteError"), severity: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ListPageTemplate translationPrefix="transaction">
      <Stack spacing={2}>
        <TransactionFilter
          sx={{ display: selectedIds.length === 0 ? "block" : "none" }}
          marginTop={0}
          open={true}
          data={filter}
          onSelectTransactionTypes={handleSelectTransactionTypes}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onSearchTextChange={handleSearchTextChange}
          onSearchFieldChange={handleSearchFieldChange}
          onReset={handleReset}
        />
        <TransactionsAcceptedActions
          open={selectedIds.length > 0}
          selectedIds={selectedIds}
          onCancel={handleCancelSelected}
          onDelete={handleDeleteSelected}
          isDeleting={isDeleting}
        />
        <Transactions
          filter={filter}
          refreshTrigger={refreshTrigger}
          selectedIds={selectedIds}
          onSelectChange={handleSelectChange}
          onSelectAllChange={handleSelectAllChange}
          onRowDeleted={handleRowDeleted}
        />
      </Stack>
    </ListPageTemplate>
  );
}

export default withTranslation(transactionContext.name)(TransactionMain);