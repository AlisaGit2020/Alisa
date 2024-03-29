import { transactionContext } from "@alisa-lib/alisa-contexts";
import Transactions from "./Transactions";
import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Button, Drawer } from "@mui/material";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TransactionListFilter, {
  TransactionFilter,
  getMonthList,
} from "./components/TransactionListFilter";
import DataService from "@alisa-lib/data-service";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import AlisaContent from "../alisa/AlisaContent";
import CheckIcon from "@mui/icons-material/Check";
import {
  getFirstProperty,
  getPropertyIdByName,
  getPropertyNameById,
} from "./utils/TransactionMainFunctions";

function TransactionMain({ t }: WithTranslation) {
  const { propertyName } = useParams();
  const [propertyName2, setPropertyName2] = useState<string | undefined>(
    propertyName,
  );
  const navigate = useNavigate();

  const dataService = new DataService<TransactionFilter>({
    context: transactionContext,
  });

  const date = new Date();

  const [filter, setFilter] = useState<TransactionFilter>({
    propertyId: 0,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  } as TransactionFilter);

  const [filterOpen, setFilterOpen] = useState<boolean>(false);

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
      handleChange("propertyId", id);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyName2]);

  const handlePropertyIdChange = async (propertyId: number) => {
    const name = await getPropertyNameById(propertyId);
    navigate(`${transactionContext.routePath}/${name}`);
    setPropertyName2(name);
  };

  const handleChange = (fieldName: string, selectedValue: number) => {
    if (fieldName === "propertyId") {
      handlePropertyIdChange(selectedValue);
    }
    const newFilter = dataService.updateNestedData(
      filter,
      fieldName,
      selectedValue,
    );
    setFilter(newFilter);
  };

  const getMonthText = (month: number): string => {
    const monthList = getMonthList(t);
    return monthList[month - 1].name;
  };

  return (
    <AlisaContent headerText={t("transactions")}>
      <Box marginBottom={2}>
        <Button
          variant="outlined"
          onClick={() => setFilterOpen(true)}
          startIcon={<FilterAltOutlinedIcon></FilterAltOutlinedIcon>}
        >
          {propertyName2}, {getMonthText(filter.month)} {filter.year}
        </Button>
      </Box>

      <Drawer open={filterOpen} onClose={() => setFilterOpen(false)}>
        <TransactionListFilter
          filter={filter}
          onChange={handleChange}
        ></TransactionListFilter>
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Button
            startIcon={<CheckIcon></CheckIcon>}
            sx={{ width: 75 }}
            variant={"contained"}
            onClick={() => setFilterOpen(false)}
          >
            {t("ok")}
          </Button>
        </Box>
      </Drawer>
      <Transactions filter={filter}></Transactions>
    </AlisaContent>
  );
}

export default withTranslation(transactionContext.name)(TransactionMain);
