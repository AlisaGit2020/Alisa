import { Transaction } from "@alisa-backend/accounting/transaction/entities/transaction.entity";
import DataService from "@alisa-lib/data-service";
import { WithTranslation, withTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";
import React from "react";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import expense from "src/translations/expense/en";

interface TransactionDetailsProps extends WithTranslation {
  id: number;
  onClose: () => void;
}

function TransactionDetails({ t, id, onClose }: TransactionDetailsProps) {
  const [data, setData] = React.useState<Transaction>({
    id: 0,
    sender: "",
    receiver: "",
    description: "",
    transactionDate: new Date("2000-01-01"),
    accountingDate: new Date("2000-01-01"),
    amount: 0,
    quantity: 0,
    totalAmount: 0,
    expense: undefined,
    income: undefined,
  });

  React.useEffect(() => {
    if (id) {
      const dataService = new DataService<Transaction>({
        context: transactionContext,
        relations: {
          expense: { expenseType: true },
          income: { incomeType: true },
        },
      });
      const fetchData = async () => {
        const newData: Transaction = await dataService.read(id);
        setData(newData);
      };

      fetchData();
    }
  }, [id]);

  const getFormatDate = (date: string | Date) => {
    return t("format.date", {
      val: new Date(date),
      formatParams: {
        val: { year: "numeric", month: "numeric", day: "numeric" },
      },
    });
  };

  const getCurrency = (value: number) => {
    return t("format.currency.euro", { val: value });
  };

  return (
    <Dialog
      open={Boolean(id)}
      onClose={onClose}
      fullWidth={true}
      maxWidth={"lg"}
    >
      <DialogTitle>{t("detailsTitle")}</DialogTitle>
      <DialogContent dividers>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>{t("id")}:</TableCell>
              <TableCell>{data.id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("externalId")}:</TableCell>
              <TableCell>{data.externalId}</TableCell>
            </TableRow>
            {data.expense && (
              <>
                <TableRow>
                  <TableCell>{t("expenseType")}:</TableCell>
                  <TableCell>{data.expense.expenseType.name}</TableCell>
                </TableRow>
              </>
            )}
            {data.income && (
              <>
                <TableRow>
                  <TableCell>{t("incomeType")}:</TableCell>
                  <TableCell>{data.income.incomeType.name}</TableCell>
                </TableRow>
              </>
            )}
            <TableRow>
              <TableCell>{t("sender")}:</TableCell>
              <TableCell>{data.sender}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("receiver")}:</TableCell>
              <TableCell>{data.receiver}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("description")}:</TableCell>
              <TableCell>{data.description}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("transactionDate")}:</TableCell>
              <TableCell>{getFormatDate(data.transactionDate)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("accountingDate")}:</TableCell>
              <TableCell>{getFormatDate(data.accountingDate)}</TableCell>
            </TableRow>
            {data.quantity > 1 && (
              <>
                <TableRow>
                  <TableCell>{t("amount")}:</TableCell>
                  <TableCell>{getCurrency(data.amount)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t("amount")}:</TableCell>
                  <TableCell>{data.quantity}</TableCell>
                </TableRow>
              </>
            )}

            <TableRow>
              <TableCell>{t("totalAmount")}:</TableCell>
              <TableCell>{getCurrency(data.totalAmount)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

export default withTranslation(transactionContext.name)(TransactionDetails);
