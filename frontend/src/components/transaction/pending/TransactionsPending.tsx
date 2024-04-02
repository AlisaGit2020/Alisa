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
import AlisaPropertySelect from "../../alisa/AlisaPropertySelect.tsx";
import TransactionImport from "../components/TransactionImport.tsx";
import TransactionAddMenu from "../components/TransactionAddMenu.tsx";
import TransactionsPendingActions from "./TransactionsPendingActions.tsx";

interface TransactionsPendingProps extends WithTranslation {}

function TransactionsPending({ t }: TransactionsPendingProps) {
  const [propertyId, setPropertyId] = React.useState<number>(0);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [detailId, setDetailId] = React.useState<number>(0);
  const [editId, setEditId] = React.useState<number>(0);
  const [addType, setAddType] = React.useState<TransactionType | undefined>(
    undefined,
  );
  const [anchorElAdd, setAnchorElAdd] = React.useState<null | HTMLElement>(
    null,
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

  const handleDeleteSelected = () => {};
  const handleEditSelected = () => {};
  const handleApproveSelected = () => {};
  const handleCancelSelected = () => {
    setSelectedIds([]);
  };

  const handleSelectProperty = (propertyId: number) => {
    setPropertyId(propertyId);
  };

  const handleSelectChange = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAllChange = (ids: number[]) => {
    setSelectedIds(ids);
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
      propertyId: propertyId,
      status: TransactionStatus.PENDING,
    },
  } as TypeOrmFetchOptions<Transaction>;

  return (
    <Box>
      <AlisaPropertySelect
        onSelectProperty={handleSelectProperty}
      ></AlisaPropertySelect>

      <TransactionsPendingActions
        marginTop={3}
        selectedIds={selectedIds}
        open={selectedIds.length > 0}
        onApprove={handleApproveSelected}
        onEdit={handleEditSelected}
        onCancel={handleCancelSelected}
        onDelete={handleDeleteSelected}
      ></TransactionsPendingActions>

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
          onSelectChange={handleSelectChange}
          onSelectAllChange={handleSelectAllChange}
          selectedIds={selectedIds}
          onEdit={handleEdit}
          onOpen={handleOpenDetails}
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
          status={TransactionStatus.ACCEPTED}
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
