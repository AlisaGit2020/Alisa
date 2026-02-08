import { Stack } from "@mui/material";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import Transactions from "./Transactions";
import { withTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { ListPageTemplate } from "../templates";
import TransactionFilter, {
  SearchField,
  TransactionFilterData,
} from "./components/TransactionFilter";
import { TransactionType } from "@alisa-types";
import {
  getStoredFilter,
  setStoredFilter,
  getTransactionPropertyId,
} from "@alisa-lib/initial-data";
import { View } from "@alisa-lib/views";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "./TransactionLeftMenuItems";

const getDefaultFilter = (): TransactionFilterData => ({
  propertyId: 0,
  transactionTypes: [],
  startDate: null,
  endDate: null,
  searchText: "",
  searchField: "sender",
});

function TransactionMain() {
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

  return (
    <ListPageTemplate translationPrefix="transaction">
      <Stack spacing={2}>
        <TransactionFilter
          marginTop={0}
          open={true}
          data={filter}
          onSelectTransactionTypes={handleSelectTransactionTypes}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onSearchTextChange={handleSearchTextChange}
          onSearchFieldChange={handleSearchFieldChange}
          onReset={handleReset}
        ></TransactionFilter>
        <Transactions
          filter={filter}
          refreshTrigger={refreshTrigger}
        ></Transactions>
      </Stack>
    </ListPageTemplate>
  );
}

export default withTranslation(transactionContext.name)(TransactionMain);