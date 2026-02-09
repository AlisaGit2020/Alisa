import { Box, Paper } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import AlisaDataTable from "../alisa/datatable/AlisaDataTable.tsx";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { Transaction, TransactionStatus, TransactionType } from "@alisa-types";
import DataService from "@alisa-lib/data-service";
import { TypeOrmFetchOptions } from "@alisa-lib/types";
import React from "react";
import TransactionAddMenu from "./components/TransactionAddMenu";
import { TransactionFilterData } from "./components/TransactionFilter";
import TransactionDetails from "./components/TransactionDetails";
import TransactionForm from "./TransactionForm.tsx";
import { usePropertyRequired } from "@alisa-lib/hooks/usePropertyRequired";
import { PropertyRequiredSnackbar } from "../alisa/PropertyRequiredSnackbar";

interface TransactionsProps extends WithTranslation {
  filter: TransactionFilterData;
  refreshTrigger?: number;
  selectedIds?: number[];
  onSelectChange?: (id: number) => void;
  onSelectAllChange?: (ids: number[]) => void;
  onRowDeleted?: (id: number) => void;
}

function Transactions({
  t,
  filter,
  refreshTrigger,
  selectedIds,
  onSelectChange,
  onSelectAllChange,
  onRowDeleted,
}: TransactionsProps) {
  const [anchorElAdd, setAnchorElAdd] = React.useState<null | HTMLElement>(
    null,
  );
  const [detailId, setDetailId] = React.useState<number>(0);
  const [editId, setEditId] = React.useState<number>(0);
  const [addType, setAddType] = React.useState<TransactionType | undefined>(
    undefined,
  );

  const { requireProperty, popoverOpen, popoverAnchorEl, closePopover, openPropertySelector } =
    usePropertyRequired(filter.propertyId);

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

  const handleOpenDetails = (id: number) => {
    setDetailId(id);
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
      status: TransactionStatus.ACCEPTED,
      propertyId: filter.propertyId > 0 ? filter.propertyId : undefined,
      type:
        filter.transactionTypes && filter.transactionTypes.length > 0
          ? { $in: filter.transactionTypes }
          : undefined,
      transactionDate: getDateFilter(),
      [filter.searchField]: getSearchFilter(),
    },
  } as TypeOrmFetchOptions<Transaction>;

  return (
    <Box>
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
              label: "",
            },
            { name: "transactionDate", format: "date" },
            { name: "sender", maxLength: 20 },
            { name: "receiver", maxLength: 20 },
            { name: "description", maxLength: 40 },
            { name: "amount", format: "currency", sum: true },
          ]}
          onNewRow={handleOpenAddMenu}
          onOpen={handleOpenDetails}
          refreshTrigger={refreshTrigger}
          selectedIds={selectedIds}
          onSelectChange={onSelectChange}
          onSelectAllChange={onSelectAllChange}
          onDelete={onRowDeleted}
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
          propertyId={filter.propertyId}
          onClose={() => setEditId(0)}
          onAfterSubmit={() => setEditId(0)}
          onCancel={() => setEditId(0)}
        ></TransactionForm>
      )}

      {addType !== undefined && (
        <TransactionForm
          open={true}
          status={TransactionStatus.ACCEPTED}
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
    </Box>
  );
}

export default withTranslation(transactionContext.name)(Transactions);
