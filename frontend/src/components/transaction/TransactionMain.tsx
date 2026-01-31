import { transactionContext } from "@alisa-lib/alisa-contexts";
import Transactions from "./Transactions";
import { withTranslation } from "react-i18next";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AlisaContent from "../alisa/AlisaContent";
import {
  getFirstProperty,
  getPropertyIdByName,
  getPropertyNameById,
} from "./utils/TransactionMainFunctions";
import TransactionFilter, {
  SearchField,
  TransactionFilterData,
} from "./components/TransactionFilter";
import { TransactionType } from "@alisa-backend/common/types";
import { getStoredFilter, setStoredFilter } from "@alisa-lib/initial-data";
import { View } from "@alisa-lib/views";

const getDefaultFilter = (): TransactionFilterData => ({
  propertyId: 0,
  transactionTypes: [],
  startDate: null,
  endDate: null,
  searchText: "",
  searchField: "sender",
});

function TransactionMain() {
  const { propertyName } = useParams();
  const [propertyName2, setPropertyName2] = useState<string | undefined>(
    propertyName,
  );
  const navigate = useNavigate();

  const [filter, setFilter] = useState<TransactionFilterData>(() => {
    const stored = getStoredFilter<TransactionFilterData>(View.TRANSACTION_APPROVED);
    return stored || getDefaultFilter();
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const updateFilter = (newFilter: TransactionFilterData) => {
    setFilter(newFilter);
    setStoredFilter(View.TRANSACTION_APPROVED, newFilter);
    setRefreshTrigger((prev) => prev + 1);
  };

  React.useEffect(() => {
    const getFirstPropertyAndNavigate = async () => {
      if (!propertyName) {
        const name = await getFirstProperty(propertyName);
        setPropertyName2(name);
        navigate(`${transactionContext.routePath}/${name}`);
      }
    };
    getFirstPropertyAndNavigate().then(() => {});
  }, [propertyName, navigate]);

  React.useEffect(() => {
    if (!propertyName2) {
      return;
    }
    const fetchPropertyId = async () => {
      return await getPropertyIdByName(propertyName2 as string);
    };

    fetchPropertyId().then((id: number) => {
      // Only update propertyId if it's different from stored
      if (filter.propertyId !== id) {
        updateFilter({ ...filter, propertyId: id });
      } else {
        setRefreshTrigger((prev) => prev + 1);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyName2]);

  const handleSelectProperty = async (propertyId: number) => {
    const name = await getPropertyNameById(propertyId);
    navigate(`${transactionContext.routePath}/${name}`);
    setPropertyName2(name);
    updateFilter({ ...filter, propertyId });
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

  return (
    <AlisaContent>
      <TransactionFilter
        marginTop={0}
        open={true}
        data={filter}
        onSelectProperty={handleSelectProperty}
        onSelectTransactionTypes={handleSelectTransactionTypes}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onSearchTextChange={handleSearchTextChange}
        onSearchFieldChange={handleSearchFieldChange}
        onReset={handleReset}
      ></TransactionFilter>
      <Transactions filter={filter} refreshTrigger={refreshTrigger}></Transactions>
    </AlisaContent>
  );
}

export default withTranslation(transactionContext.name)(TransactionMain);
