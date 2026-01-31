import { Box, Paper } from "@mui/material";

import { WithTranslation, withTranslation } from "react-i18next";
import AlisaDataTable from "../../alisa/datatable/AlisaDataTable.tsx";
import { transactionContext } from "@alisa-lib/alisa-contexts.ts";
import { Transaction } from "@alisa-backend/accounting/transaction/entities/transaction.entity.ts";
import DataService from "@alisa-lib/data-service.ts";
import { TypeOrmFetchOptions } from "@alisa-lib/types.ts";
import React from "react";
import TransactionDetails from "../components/TransactionDetails.tsx";
import TransactionForm from "../TransactionForm.tsx";
import {
  TransactionStatus,
  TransactionType,
} from "@alisa-backend/common/types.ts";
import TransactionImport from "../components/TransactionImport.tsx";
import TransactionAddMenu from "../components/TransactionAddMenu.tsx";
import TransactionsPendingActions from "./TransactionsPendingActions.tsx";
import TransactionsPendingFilter, {
  SearchField,
} from "./TransactionsPendingFilter.tsx";
import ApiClient from "@alisa-lib/api-client.ts";
import { TransactionAcceptInputDto } from "@alisa-backend/accounting/transaction/dtos/transaction-accept-input.dto.ts";
import { DataSaveResultDto } from "@alisa-backend/common/dtos/data-save-result.dto.ts";
import { TransactionSetTypeInputDto } from "@alisa-backend/accounting/transaction/dtos/transaction-set-type-input.dto.ts";
import { TransactionSetCategoryTypeInputDto } from "@alisa-backend/accounting/transaction/dtos/transaction-set-category-type-input.dto.ts";
import { SplitLoanPaymentBulkInputDto } from "@alisa-backend/accounting/transaction/dtos/split-loan-payment-bulk-input.dto.ts";
import { DATA_NOT_SELECTED_ID } from "@alisa-lib/constants.ts";
import { getInitialId, setInitialPropertyId } from "@alisa-lib/initial-data.ts";
import { DataKey, View } from "@alisa-lib/views.ts";

interface TransactionsPendingProps extends WithTranslation {}

function TransactionsPending({ t }: TransactionsPendingProps) {
  const [propertyId, setPropertyId] = React.useState<number>(
    getInitialId(View.TRANSACTION_PENDING, DataKey.PROPERTY_ID),
  );
  const [transactionType, setTransactionType] =
    React.useState<number>(DATA_NOT_SELECTED_ID);
  const [searchText, setSearchText] = React.useState<string>("");
  const [searchField, setSearchField] = React.useState<SearchField>("sender");
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
  const [importOpen, setImportOpen] = React.useState<boolean>(false);
  const [saveResult, setSaveResult] = React.useState<
    DataSaveResultDto | undefined
  >(undefined);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handleOpenAddMenu = (
    event?: React.MouseEvent<HTMLButtonElement>,
  ): void => {
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
  const handleOpenImport = () => {
    setImportOpen(true);
    handleCloseAddMenu();
  };

  const handleEdit = (id: number) => {
    setEditId(id);
  };

  const handleOpenDetails = (id: number) => {
    setDetailId(id);
  };

  const handleDeleteSelected = async () => {
    setSaveResult(undefined);
    if (selectedIds.length > 0) {
      const result = await ApiClient.postSaveTask<TransactionAcceptInputDto>(
        transactionContext.apiPath + "/delete",
        {
          ids: selectedIds,
        },
      );
      if (result.allSuccess) {
        setSelectedIds([]);
        setSelectedTransactionTypes([]);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setSaveResult(result);
      }
    }
  };

  const handleSetTypeForSelected = async (type: number) => {
    setSaveResult(undefined);
    if (selectedIds.length > 0 && type > 0) {
      const result = await ApiClient.postSaveTask<TransactionSetTypeInputDto>(
        transactionContext.apiPath + "/type",
        {
          ids: selectedIds,
          type: type,
        },
      );
      if (!result.allSuccess) {
        setSaveResult(result);
      } else {
        setRefreshTrigger((prev) => prev + 1);
      }
    }
  };
  const handleApproveSelected = async () => {
    const result = await ApiClient.postSaveTask<TransactionAcceptInputDto>(
      transactionContext.apiPath + "/accept",
      {
        ids: selectedIds,
      },
    );
    if (result.allSuccess) {
      setSelectedIds([]);
      setSaveResult(undefined);
      setRefreshTrigger((prev) => prev + 1);
    } else {
      setSaveResult(result);
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
    setSaveResult(undefined);
    if (selectedIds.length > 0) {
      const result =
        await ApiClient.postSaveTask<TransactionSetCategoryTypeInputDto>(
          transactionContext.apiPath + "/category-type",
          {
            ids: selectedIds,
            expenseTypeId,
            incomeTypeId,
          },
        );
      if (!result.allSuccess) {
        setSaveResult(result);
      } else {
        setRefreshTrigger((prev) => prev + 1);
      }
    }
  };

  const handleSplitLoanPaymentForSelected = async (
    principalExpenseTypeId: number,
    interestExpenseTypeId: number,
    handlingFeeExpenseTypeId?: number,
  ) => {
    setSaveResult(undefined);
    if (selectedIds.length > 0) {
      const result =
        await ApiClient.postSaveTask<SplitLoanPaymentBulkInputDto>(
          transactionContext.apiPath + "/split-loan-payment",
          {
            ids: selectedIds,
            principalExpenseTypeId,
            interestExpenseTypeId,
            handlingFeeExpenseTypeId,
          },
        );
      if (!result.allSuccess) {
        setSaveResult(result);
      } else {
        setRefreshTrigger((prev) => prev + 1);
      }
    }
  };

  const handleSelectProperty = (propertyId: number) => {
    setInitialPropertyId(
      View.TRANSACTION_PENDING,
      DataKey.PROPERTY_ID,
      propertyId,
    );
    setPropertyId(propertyId);
  };

  const handleSelectTransactionType = (transactionType: number) => {
    setTransactionType(transactionType);
  };

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
  };

  const handleSearchFieldChange = (field: SearchField) => {
    setSearchField(field);
  };

  const handleSelectChange = (id: number, item?: Transaction) => {
    setSaveResult(undefined);
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
    if (!searchText) return undefined;
    return { $ilike: `%${searchText}%` };
  };

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
      expenses: true,
      incomes: true,
    },
    order: {
      transactionDate: "DESC",
    },

    where: {
      propertyId: propertyId,
      status: TransactionStatus.PENDING,
      type:
        transactionType === DATA_NOT_SELECTED_ID ? undefined : transactionType,
      [searchField]: getSearchFilter(),
    },
  } as TypeOrmFetchOptions<Transaction>;

  return (
    <Box>
      <TransactionsPendingFilter
        marginTop={3}
        open={selectedIds.length === 0}
        data={{
          propertyId: propertyId,
          transactionTypeId: transactionType,
          searchText: searchText,
          searchField: searchField,
        }}
        onSelectProperty={handleSelectProperty}
        onSelectTransactionType={handleSelectTransactionType}
        onSearchTextChange={handleSearchTextChange}
        onSearchFieldChange={handleSearchFieldChange}
      ></TransactionsPendingFilter>

      <TransactionsPendingActions
        marginTop={3}
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
        saveResult={saveResult}
      ></TransactionsPendingActions>

      <Paper sx={{ marginTop: 3 }}>
        <AlisaDataTable<Transaction>
          t={t}
          dataService={
            new DataService({ context: transactionContext, fetchOptions })
          }
          fields={[
            {
              name: "type",
              format: "transactionType",
              label: t("transactionType"),
            },
            { name: "transactionDate", format: "date" },
            { name: "sender", maxLength: 30 },
            { name: "receiver", maxLength: 30 },
            { name: "description", maxLength: 40 },
            { name: "amount", format: "currency" },
          ]}
          onNewRow={handleOpenAddMenu}
          onSelectChange={handleSelectChange}
          onSelectAllChange={handleSelectAllChange}
          selectedIds={selectedIds}
          onEdit={handleEdit}
          onOpen={handleOpenDetails}
          refreshTrigger={refreshTrigger}
        />
      </Paper>

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
          propertyId={propertyId}
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
          propertyId={propertyId}
          onClose={() => setAddType(undefined)}
          onAfterSubmit={() => setAddType(undefined)}
          onCancel={() => setAddType(undefined)}
        ></TransactionForm>
      )}

      {importOpen && (
        <TransactionImport
          open={importOpen}
          propertyId={propertyId}
          onClose={() => setImportOpen(false)}
          t={t}
        ></TransactionImport>
      )}

      <TransactionAddMenu
        t={t}
        anchorEl={anchorElAdd}
        onClose={handleCloseAddMenu}
        onAddTransaction={handleAdd}
        onImport={handleOpenImport}
      ></TransactionAddMenu>
    </Box>
  );
}

export default withTranslation(transactionContext.name)(TransactionsPending);
