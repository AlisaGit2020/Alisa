import { Box, Paper } from "@mui/material";

import { WithTranslation, withTranslation } from "react-i18next";
import AlisaDataTable from "../alisa/datatable/AlisaDataTable.tsx";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { Transaction } from "@alisa-backend/accounting/transaction/entities/transaction.entity";
import DataService from "@alisa-lib/data-service";
import { TypeOrmFetchOptions } from "@alisa-lib/types";
import React from "react";
import TransactionDetails from "./components/TransactionDetails";
import TransactionForm from "./TransactionForm.tsx";
import {
  TransactionStatus,
  TransactionType,
} from "@alisa-backend/common/types.ts";
import AlisaPropertySelect from "../alisa/AlisaPropertySelect.tsx";

interface TransactionsProps extends WithTranslation {}

function Transactions({ t }: TransactionsProps) {
  const [propertyId, setPropertyId] = React.useState<number>(0);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [detailId, setDetailId] = React.useState<number>(0);
  const [editId, setEditId] = React.useState<number>(0);
  const [deletedId, setDeletedId] = React.useState<number>(0);
  const [addType, setAddType] = React.useState<TransactionType | undefined>(
    undefined,
  );
  const [anchorElAdd, setAnchorElAdd] = React.useState<null | HTMLElement>(
    null,
  );

  const handleOpenAddMenu = (
    event?: React.MouseEvent<HTMLButtonElement>,
  ): void => {
    if (event !== undefined) {
      setAnchorElAdd(event.currentTarget);
    }
  };

  const handleEdit = (id: number) => {
    setEditId(id);
  };

  const handleDelete = (id: number) => {
    setTimeout(() => setDeletedId(id), 200);
  };

  const handleOpenDetails = (id: number) => {
    setDetailId(id);
  };

  const handleSelectProperty = (propertyId: number) => {
    setPropertyId(propertyId);
  };

  const handleSelectDataRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
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
          onSelect={handleSelectDataRow}
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

      {addType !== undefined && (
        <TransactionForm
          open={true}
          type={addType}
          propertyId={1}
          onClose={() => setAddType(undefined)}
          onAfterSubmit={() => setAddType(undefined)}
          onCancel={() => setAddType(undefined)}
        ></TransactionForm>
      )}
    </Box>
  );
}

export default withTranslation(transactionContext.name)(Transactions);
