import { WithTranslation, withTranslation } from "react-i18next";
import DataService from "@alisa-lib/data-service";
import { Box, Paper, Stack } from "@mui/material";
import { TransactionStatisticsDto } from "@alisa-backend/accounting/transaction/dtos/transaction-statistics.dto";
import React from "react";
import { Transaction } from "@alisa-backend/accounting/transaction/entities/transaction.entity";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { TypeOrmRelationOption, TypeOrmWhereOption } from "@alisa-lib/types";

interface TransactionListStatisticsProps extends WithTranslation {
  relations?: TypeOrmRelationOption;
  where?: TypeOrmWhereOption<Transaction> & Record<string, unknown>;
  deletedId: number;
}

function TransactionListStatistics({
  t,
  where,
  relations,
  deletedId,
}: TransactionListStatisticsProps) {
  const [data, setData] = React.useState<TransactionStatisticsDto>(
    new TransactionStatisticsDto(),
  );

  React.useEffect(() => {
    const dataService = new DataService<Transaction>({
      context: transactionContext,
      fetchOptions: {
        relations: relations,
        where: where,
      },
    });
    const fetchData = async () => {
      const newData: TransactionStatisticsDto =
        await dataService.statistics<TransactionStatisticsDto>();
      setData(newData);
    };

    fetchData();
  }, [relations, where, deletedId]);

  const infoBox = (
    headerText: string,
    contentText: string,
    backgroundColor: string,
    fontColor: string,
  ) => {
    return (
      <Paper
        sx={{
          width: "100%",
          padding: 2,
          display: "flex",
          justifyContent: "space-between",
          bgcolor: backgroundColor,
          color: fontColor,
        }}
      >
        <Box>{headerText}</Box>
        <Box sx={{ fontSize: "20px" }}>{contentText}</Box>
      </Paper>
    );
  };

  return (
    <Stack direction={"row"} spacing={2} marginBottom={2}>
      {infoBox(
        t("totalIncomes"),
        t("format.currency.euro", { val: data.totalIncomes }),
        "success.light",
        "white",
      )}
      {infoBox(
        t("totalExpenses"),
        t("format.currency.euro", { val: data.totalExpenses }),
        "error.light",
        "white",
      )}
      {infoBox(
        t("total"),
        t("format.currency.euro", { val: data.total }),
        "primary.light",
        "white",
      )}
      {infoBox(
        t("balance"),
        t("format.currency.euro", { val: data.balance }),
        "secondary.light",
        "white",
      )}
    </Stack>
  );
}

export default withTranslation(transactionContext.name)(
  TransactionListStatistics,
);
