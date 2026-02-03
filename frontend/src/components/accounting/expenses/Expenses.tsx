import { Paper } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import AlisaDataTable from "../../alisa/datatable/AlisaDataTable";
import { expenseContext } from "@alisa-lib/alisa-contexts";
import { Expense } from "@alisa-backend/accounting/expense/entities/expense.entity";
import DataService from "@alisa-lib/data-service";
import { TypeOrmFetchOptions } from "@alisa-lib/types";
import { useState, useEffect, useMemo } from "react";
import AlisaContent from "../../alisa/AlisaContent";
import ExpenseForm from "./ExpenseForm";
import AccountingFilter, { AccountingFilterData } from "../AccountingFilter";
import {
  getStoredFilter,
  setStoredFilter,
  getTransactionPropertyId,
} from "@alisa-lib/initial-data";
import { View } from "@alisa-lib/views";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../../transaction/TransactionLeftMenuItems";

const getDefaultFilter = (): AccountingFilterData => ({
  typeIds: [],
  searchText: "",
  startDate: null,
  endDate: null,
});

interface ExpenseRow {
  id: number;
  accountingDate: Date | null;
  expenseTypeName: string;
  description: string;
  quantity: number;
  amount: number;
  totalAmount: number;
}

function Expenses({ t }: WithTranslation) {
  const [propertyId, setPropertyId] = useState<number>(() =>
    getTransactionPropertyId()
  );
  const [filter, setFilter] = useState<AccountingFilterData>(() => {
    const stored = getStoredFilter<AccountingFilterData>(View.EXPENSES);
    return stored || getDefaultFilter();
  });
  const [editId, setEditId] = useState<number | undefined>(undefined);
  const [addNew, setAddNew] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    setStoredFilter(View.EXPENSES, newFilter);
    setRefreshTrigger((prev) => prev + 1);
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

  const fetchOptions: TypeOrmFetchOptions<Expense> = useMemo(
    () => ({
      relations: {
        expenseType: true,
        property: true,
      },
      order: {
        accountingDate: "DESC",
        id: "DESC",
      },
      where: {
        propertyId: propertyId > 0 ? propertyId : undefined,
        expenseTypeId:
          filter.typeIds.length > 0 ? { $in: filter.typeIds } : undefined,
        description: filter.searchText
          ? { $ilike: `%${filter.searchText}%` }
          : undefined,
        accountingDate: getDateFilter(),
      },
    }),
    [propertyId, filter.typeIds, filter.searchText, filter.startDate, filter.endDate]
  );

  const dataService = useMemo(
    () => new DataService<Expense>({ context: expenseContext, fetchOptions }),
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

  const handleAdd = () => {
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

  // Create a simple data service wrapper for the transformed data
  const rowDataService = useMemo(() => {
    const service = {
      search: async () => {
        const expenses = await dataService.search();
        return expenses.map((expense) => ({
          id: expense.id,
          accountingDate: expense.accountingDate || null,
          expenseTypeName: expense.expenseType?.name || "",
          description: expense.description,
          quantity: expense.quantity,
          amount: expense.amount,
          totalAmount: expense.totalAmount,
        }));
      },
      delete: async (id: number) => {
        await dataService.delete(id);
      },
    } as DataService<ExpenseRow>;
    return service;
  }, [dataService]);

  return (
    <AlisaContent>
      <AccountingFilter
        mode="expense"
        data={filter}
        onTypeChange={handleTypeChange}
        onSearchTextChange={handleSearchTextChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onReset={handleReset}
      />

      <Paper>
        <AlisaDataTable<ExpenseRow>
          t={t}
          dataService={rowDataService}
          fields={[
            { name: "accountingDate", format: "date" },
            { name: "expenseTypeName", label: t("expenseType") },
            { name: "description", maxLength: 40 },
            { name: "quantity", format: "number" },
            { name: "amount", format: "currency" },
            { name: "totalAmount", format: "currency", sum: true },
          ]}
          onNewRow={handleAdd}
          onOpen={handleOpenDetails}
          onEdit={handleOpenDetails}
          refreshTrigger={refreshTrigger}
        />
      </Paper>

      {(editId !== undefined || addNew) && (
        <ExpenseForm
          id={editId}
          propertyId={propertyId > 0 ? propertyId : undefined}
          defaultExpenseTypeId={filter.typeIds.length === 1 ? filter.typeIds[0] : undefined}
          onClose={handleFormClose}
          onAfterSubmit={handleAfterSubmit}
          onCancel={handleFormClose}
        />
      )}
    </AlisaContent>
  );
}

export default withTranslation("accounting")(Expenses);
