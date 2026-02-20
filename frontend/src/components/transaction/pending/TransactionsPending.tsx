import { Paper, Stack } from "@mui/material";

import { WithTranslation, withTranslation } from "react-i18next";
import AlisaDataTable from "../../alisa/datatable/AlisaDataTable.tsx";
import { transactionContext } from "@alisa-lib/alisa-contexts.ts";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
  TransactionAcceptInput,
  TransactionSetTypeInput,
  TransactionSetCategoryTypeInput,
  SplitLoanPaymentBulkInput,
} from "@alisa-types";
import DataService from "@alisa-lib/data-service.ts";
import { TypeOrmFetchOptions } from "@alisa-lib/types.ts";
import React from "react";
import TransactionDetails from "../components/TransactionDetails.tsx";
import TransactionForm from "../TransactionForm.tsx";
import TransactionAddMenu from "../components/TransactionAddMenu.tsx";
import TransactionsPendingActions from "./TransactionsPendingActions.tsx";
import TransactionFilter, {
  SearchField,
  TransactionFilterData,
} from "../components/TransactionFilter.tsx";
import ApiClient from "@alisa-lib/api-client.ts";
import {
  getStoredFilter,
  setStoredFilter,
  getTransactionPropertyId,
} from "@alisa-lib/initial-data.ts";
import { View } from "@alisa-lib/views.ts";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../TransactionLeftMenuItems.tsx";
import { ListPageTemplate } from "../../templates";
import { usePropertyRequired } from "@alisa-lib/hooks/usePropertyRequired";
import { PropertyRequiredSnackbar, useToast } from "../../alisa";
import TransactionCategoryChips from "../components/TransactionCategoryChips";

const getDefaultFilter = (): TransactionFilterData => ({
  propertyId: 0,
  transactionTypes: [],
  startDate: null,
  endDate: null,
  searchText: "",
  searchField: "sender",
});

function TransactionsPending({ t }: WithTranslation) {
  // Always use the global property selection from AppBar
  const globalPropertyId = getTransactionPropertyId();

  const [filter, setFilter] = React.useState<TransactionFilterData>(() => {
    const stored = getStoredFilter<TransactionFilterData>(View.TRANSACTION_PENDING);
    if (stored) {
      return { ...stored, propertyId: globalPropertyId };
    }
    return { ...getDefaultFilter(), propertyId: globalPropertyId };
  });
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [selectedTransactionTypes, setSelectedTransactionTypes] = React.useState<
    TransactionType[]
  >([]);
  const [detailId, setDetailId] = React.useState<number>(0);
  const [editId, setEditId] = React.useState<number>(0);
  const [addType, setAddType] = React.useState<TransactionType | undefined>(
    undefined,
  );
  const [anchorElAdd, setAnchorElAdd] = React.useState<null | HTMLElement>(
    null,
  );
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const { requireProperty, popoverOpen, popoverAnchorEl, closePopover, openPropertySelector } =
    usePropertyRequired(filter.propertyId);
  const { showToast } = useToast();

  const updateFilter = (newFilter: TransactionFilterData) => {
    setFilter(newFilter);
    setStoredFilter(View.TRANSACTION_PENDING, newFilter);
    setRefreshTrigger((prev) => prev + 1);
  };

  React.useEffect(() => {
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

  const handleOpenAddMenu = (
    event?: React.MouseEvent<HTMLButtonElement>,
  ): void => {
    if (!requireProperty(event)) return;
    if (event !== undefined) {
      setAnchorElAdd(event.currentTarget);
    }
  };

  const handleCloseAddMenu = () => {
    setAnchorElAdd(null);
  };

  const handleAdd = (type: TransactionType) => {
    setAddType(type);
    handleCloseAddMenu();
  };

  const handleEdit = (id: number) => {
    setEditId(id);
  };

  const handleOpenDetails = (id: number) => {
    setDetailId(id);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length > 0) {
      const result = await ApiClient.postSaveTask<TransactionAcceptInput>(
        transactionContext.apiPath + "/delete",
        {
          ids: selectedIds,
        },
      );
      if (result.allSuccess) {
        showToast({ message: t("common:toast.deleteSuccessCount", { count: selectedIds.length }), severity: "success" });
        setSelectedIds([]);
        setSelectedTransactionTypes([]);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showToast({ message: t("common:toast.deleteError"), severity: "error" });
      }
    }
  };

  const handleSetTypeForSelected = async (type: number) => {
    if (selectedIds.length > 0 && type > 0) {
      const result = await ApiClient.postSaveTask<TransactionSetTypeInput>(
        transactionContext.apiPath + "/type",
        {
          ids: selectedIds,
          type: type,
        },
      );
      if (result.allSuccess) {
        showToast({ message: t("common:toast.typeUpdated"), severity: "success" });
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showToast({ message: t("common:toast.updateError"), severity: "error" });
      }
    }
  };
  const handleApproveSelected = async () => {
    const result = await ApiClient.postSaveTask<TransactionAcceptInput>(
      transactionContext.apiPath + "/accept",
      {
        ids: selectedIds,
      },
    );
    if (result.allSuccess) {
      showToast({ message: t("common:toast.approveSuccess", { count: selectedIds.length }), severity: "success" });
      setSelectedIds([]);
      setRefreshTrigger((prev) => prev + 1);
    } else {
      showToast({ message: t("common:toast.approveError"), severity: "error" });
    }
  };
  const handleCancelSelected = () => {
    setSelectedIds([]);
    setSelectedTransactionTypes([]);
  };

  const handleSetCategoryTypeForSelected = async (
    expenseTypeId?: number,
    incomeTypeId?: number,
  ) => {
    if (selectedIds.length > 0) {
      const result =
        await ApiClient.postSaveTask<TransactionSetCategoryTypeInput>(
          transactionContext.apiPath + "/category-type",
          {
            ids: selectedIds,
            expenseTypeId,
            incomeTypeId,
          },
        );
      if (result.allSuccess) {
        showToast({ message: t("common:toast.categoryUpdated"), severity: "success" });
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showToast({ message: t("common:toast.updateError"), severity: "error" });
      }
    }
  };

  const handleSplitLoanPaymentForSelected = async (
    principalExpenseTypeId: number,
    interestExpenseTypeId: number,
    handlingFeeExpenseTypeId?: number,
  ) => {
    if (selectedIds.length > 0) {
      const result =
        await ApiClient.postSaveTask<SplitLoanPaymentBulkInput>(
          transactionContext.apiPath + "/split-loan-payment",
          {
            ids: selectedIds,
            principalExpenseTypeId,
            interestExpenseTypeId,
            handlingFeeExpenseTypeId,
          },
        );
      if (result.allSuccess) {
        showToast({ message: t("common:toast.loanSplit"), severity: "success" });
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showToast({ message: t("common:toast.updateError"), severity: "error" });
      }
    }
  };

  const handleSelectTransactionTypes = (transactionTypes: TransactionType[]) => {
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

  const handleSelectChange = (id: number, item?: Transaction) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
      // Remove the type for this transaction
      const index = selectedIds.indexOf(id);
      setSelectedTransactionTypes(
        selectedTransactionTypes.filter((_, i) => i !== index),
      );
    } else {
      setSelectedIds([...selectedIds, id]);
      if (item) {
        setSelectedTransactionTypes([...selectedTransactionTypes, item.type]);
      }
    }
  };

  const handleSelectAllChange = (ids: number[], items?: Transaction[]) => {
    setSelectedIds(ids);
    if (items) {
      setSelectedTransactionTypes(items.map((item) => item.type));
    } else {
      setSelectedTransactionTypes([]);
    }
  };

  const getSearchFilter = () => {
    if (!filter.searchText) return undefined;
    return { $ilike: `%${filter.searchText}%` };
  };

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

  const transactionTypes = filter.transactionTypes || [];

  const fetchOptions = {
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
      expenses: { expenseType: true },
      incomes: { incomeType: true },
    },
    order: {
      transactionDate: "DESC",
    },

    where: {
      propertyId: filter.propertyId > 0 ? filter.propertyId : undefined,
      status: TransactionStatus.PENDING,
      type: transactionTypes.length > 0 ? { $in: transactionTypes } : undefined,
      transactionDate: getDateFilter(),
      [filter.searchField]: getSearchFilter(),
    },
  } as TypeOrmFetchOptions<Transaction>;

  return (
    <ListPageTemplate
      translationPrefix="transaction"
      titleKey="pendingPageTitle"
      descriptionKey="pendingPageDescription"
    >
      <Stack spacing={2}>
        <TransactionFilter
          marginTop={0}
          open={selectedIds.length === 0}
          data={filter}
          onSelectTransactionTypes={handleSelectTransactionTypes}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onSearchTextChange={handleSearchTextChange}
          onSearchFieldChange={handleSearchFieldChange}
          onReset={handleReset}
        ></TransactionFilter>

        <TransactionsPendingActions
          marginTop={0}
          selectedIds={selectedIds}
          open={selectedIds.length > 0}
          hasExpenseTransactions={selectedTransactionTypes.includes(
            TransactionType.EXPENSE,
          )}
          hasIncomeTransactions={selectedTransactionTypes.includes(
            TransactionType.INCOME,
          )}
          onApprove={handleApproveSelected}
          onSetType={handleSetTypeForSelected}
          onSetCategoryType={handleSetCategoryTypeForSelected}
          onSplitLoanPayment={handleSplitLoanPaymentForSelected}
          onCancel={handleCancelSelected}
          onDelete={handleDeleteSelected}
        ></TransactionsPendingActions>

        <Paper>
          <AlisaDataTable<Transaction>
            t={t}
            dataService={
              new DataService({ context: transactionContext, fetchOptions })
            }
            sortable
            fields={[
              {
                name: "type",
                format: "transactionType",
                label: "",
              },
              {
                name: "expenses" as keyof Transaction,
                label: t("category"),
                render: (item) => <TransactionCategoryChips transaction={item} />,
              },
              { name: "transactionDate", format: "date" },
              { name: "sender", maxLength: 20 },
              { name: "receiver", maxLength: 20 },
              { name: "description", maxLength: 30 },
              { name: "amount", format: "currency", sum: true },
            ]}
            onNewRow={handleOpenAddMenu}
            onSelectChange={handleSelectChange}
            onSelectAllChange={handleSelectAllChange}
            selectedIds={selectedIds}
            onEdit={handleEdit}
            onOpen={handleOpenDetails}
            onDelete={() => setRefreshTrigger((prev) => prev + 1)}
            refreshTrigger={refreshTrigger}
          />
        </Paper>
      </Stack>

      {detailId > 0 && (
        <TransactionDetails
          id={detailId}
          onClose={() => setDetailId(0)}
        ></TransactionDetails>
      )}

      {editId > 0 && (
        <TransactionForm
          open={true}
          id={editId}
          propertyId={filter.propertyId}
          onClose={() => setEditId(0)}
          onAfterSubmit={() => setEditId(0)}
          onCancel={() => setEditId(0)}
        ></TransactionForm>
      )}

      {addType !== undefined && (
        <TransactionForm
          open={true}
          status={TransactionStatus.PENDING}
          type={addType}
          propertyId={filter.propertyId}
          onClose={() => setAddType(undefined)}
          onAfterSubmit={() => setAddType(undefined)}
          onCancel={() => setAddType(undefined)}
        ></TransactionForm>
      )}

      <TransactionAddMenu
        t={t}
        anchorEl={anchorElAdd}
        onClose={handleCloseAddMenu}
        onAddTransaction={handleAdd}
      ></TransactionAddMenu>

      <PropertyRequiredSnackbar
        open={popoverOpen}
        anchorEl={popoverAnchorEl}
        onClose={closePopover}
        onSelectProperty={openPropertySelector}
      />
    </ListPageTemplate>
  );
}

export default withTranslation(transactionContext.name)(TransactionsPending);
