import { Box, Paper } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import AlisaDataTable from "../alisa/AlisaDataTable";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { Transaction } from "@alisa-backend/accounting/transaction/entities/transaction.entity";
import DataService from "@alisa-lib/data-service";
import { TypeOrmFetchOptions } from "@alisa-lib/types";
import React from "react";
import TransactionAddMenu from "./components/TransactionAddMenu";
import TransactionImport from "./components/TransactionImport";
import { TransactionFilter } from "./components/TransactionListFilter";
import TransactionListStatistics from "./components/TransactionListStatistics";
import TransactionDetails from "./components/TransactionDetails";
import TransactionForm from "./TransactionForm.tsx";
import {
  TransactionStatus,
  TransactionType,
} from "@alisa-backend/common/types.ts";

interface TransactionsProps extends WithTranslation {
  filter: TransactionFilter;
}

function Transactions({ t, filter }: TransactionsProps) {
  const [anchorElAdd, setAnchorElAdd] = React.useState<null | HTMLElement>(
    null,
  );
  const [detailId, setDetailId] = React.useState<number>(0);
  const [editId, setEditId] = React.useState<number>(0);
  const [deletedId, setDeletedId] = React.useState<number>(0);
  const [addType, setAddType] = React.useState<TransactionType | undefined>(
    undefined,
  );
  const [importOpen, setImportOpen] = React.useState<boolean>(false);

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

  const handleEdit = (id: number) => {
    setEditId(id);
  };

  const handleAdd = (type: TransactionType) => {
    setAddType(type);
    handleCloseAddMenu();
  };

  const handleDelete = (id: number) => {
    setTimeout(() => setDeletedId(id), 200);
  };

  const handleOpenImport = () => {
    setImportOpen(true);
    handleCloseAddMenu();
  };

  const handleOpenDetails = (id: number) => {
    setDetailId(id);
  };

  const transactionDateFilter = (): object => {
    const startDate = new Date(filter.year, filter.month - 1, 1);
    const endDate = new Date(filter.year, filter.month, 0, 23, 59, 59);
    return {
      transactionDate: {
        $between: [startDate, endDate],
      },
    };
  };

  const fetchOptions = {
    select: {
      id: true,
      transactionDate: true,
      sender: true,
      receiver: true,
      description: true,
      amount: true,
    },
    relations: {
      expenses: true,
      incomes: true,
    },
    order: {
      transactionDate: "DESC",
    },

    where: {
      status: TransactionStatus.COMPLETED,
      propertyId: filter.propertyId,
      ...transactionDateFilter(),
    },
  } as TypeOrmFetchOptions<Transaction>;

  return (
    <Box>
      <TransactionListStatistics
        relations={fetchOptions.relations}
        where={fetchOptions.where}
        deletedId={deletedId}
      ></TransactionListStatistics>
      <Paper sx={{ marginTop: 3 }}>
        <AlisaDataTable<Transaction>
          t={t}
          dataService={
            new DataService({ context: transactionContext, fetchOptions })
          }
          fields={[
            { name: "transactionDate", format: "date" },
            { name: "sender", maxLength: 30 },
            { name: "receiver", maxLength: 30 },
            { name: "description", maxLength: 40 },
            { name: "amount", format: "currency" },
          ]}
          onNewRow={handleOpenAddMenu}
          onEdit={handleEdit}
          onOpen={handleOpenDetails}
          onDelete={handleDelete}
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
        onImport={handleOpenImport}
      ></TransactionAddMenu>

      {importOpen && (
        <TransactionImport
          open={importOpen}
          propertyId={filter.propertyId}
          onClose={() => setImportOpen(false)}
          t={t}
        ></TransactionImport>
      )}
    </Box>
  );
}

export default withTranslation(transactionContext.name)(Transactions);
