import { Paper, Stack } from "@mui/material";
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

  const fetchOptions: TypeOrmFetchOptions<Income> = useMemo(
    () => ({
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
    }),
    [propertyId, filter.typeIds, filter.searchText, filter.startDate, filter.endDate]
  );

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

  // Create a simple data service wrapper for the transformed data
  // Include refreshTrigger in dependencies to force refresh after form submit
  const rowDataService = useMemo(() => {
    const service = {
      search: async () => {
        const incomes = await dataService.search();
        return incomes.map((income) => ({
          id: income.id,
          accountingDate: income.accountingDate || null,
          incomeTypeName: income.incomeType?.name || "",
          description: income.description,
          quantity: income.quantity,
          amount: income.amount,
          totalAmount: income.totalAmount,
        }));
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
    >
      <Stack spacing={2}>
        <AccountingFilter
          mode="income"
          data={filter}
          onTypeChange={handleTypeChange}
          onSearchTextChange={handleSearchTextChange}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onReset={handleReset}
        />

        <Paper>
          <AlisaDataTable<IncomeRow>
            t={t}
            dataService={rowDataService}
            fields={[
              { name: "accountingDate", format: "date" },
              { name: "incomeTypeName", label: t("incomeType") },
              { name: "description", maxLength: 40 },
              { name: "quantity", format: "number" },
              { name: "amount", format: "currency" },
              { name: "totalAmount", format: "currency", sum: true },
            ]}
            onNewRow={handleAdd}
            onOpen={handleOpenDetails}
            onEdit={handleOpenDetails}
            onDelete={() => setRefreshTrigger((prev) => prev + 1)}
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
    </ListPageTemplate>
  );
}

export default withTranslation("accounting")(Incomes);
