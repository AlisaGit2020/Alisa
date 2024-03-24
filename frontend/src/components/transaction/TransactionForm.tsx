import { Dialog, DialogContent, Stack } from "@mui/material";
import React, { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import AlisaFormHandler from "../alisa/form/AlisaFormHandler";
import DataService from "@alisa-lib/data-service";
import { TransactionInputDto } from "@alisa-backend/accounting/transaction/dtos/transaction-input.dto";
import AlisaLoadingProgress from "../alisa/AlisaLoadingProgress";
import TransactionFormFields from "./components/TransactionFormFields";
import AlisaContent from "../alisa/AlisaContent";
import { TransactionType } from "./Transactions.tsx";
import EditableRows from "./components/EditableRows.tsx";
import { ExpenseInputDto } from "@alisa-backend/accounting/expense/dtos/expense-input.dto.ts";
import { IncomeInputDto } from "@alisa-backend/accounting/income/dtos/income-input.dto.ts";

interface TransactionFormProps extends WithTranslation {
  id?: number;
  open: boolean;
  propertyId?: number;
  type?: TransactionType;
  onAfterSubmit: () => void;
  onCancel: () => void;
  onClose: () => void;
}

function TransactionForm({
  t,
  open,
  id,
  propertyId,
  type,
  onAfterSubmit,
  onCancel,
  onClose,
}: TransactionFormProps) {
  const [data, setData] = useState<TransactionInputDto>(
    new TransactionInputDto(),
  );
  const [ready, setReady] = useState<boolean>(false);

  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

  const dataService = new DataService<TransactionInputDto>({
    context: transactionContext,
    relations: { expenses: true, incomes: true },
    dataValidateInstance: new TransactionInputDto(),
  });

  React.useEffect(() => {
    if (id === undefined) {
      const fetchData = async () => {
        const defaults = new TransactionInputDto();
        if (propertyId) {
          defaults.propertyId = propertyId;
        }
        return defaults;
      };

      fetchData().then((data) => {
        setData(data);
        setReady(true);
      });
    } else {
      setReady(true);
    }
  }, [id, propertyId]);

  const handleChange = async (name: string, value: unknown) => {
    let newData = dataService.updateNestedData(data, name, value);

    if (name === "transactionDate") {
      newData = dataService.updateNestedData(newData, "accountingDate", value);
    }
    setData(newData);
  };

  const handleRowChange = async (
    rows: ExpenseInputDto[] | IncomeInputDto[],
  ) => {
    if (getType() === TransactionType.Expense) {
      await handleChange("expenses", rows);
    } else {
      await handleChange("incomes", rows);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
  };

  const handleAmountChange = (value: number) => {
    setAmount(value);
  };

  const getType = (): TransactionType | undefined => {
    if (type !== undefined) {
      return type;
    }
    if (data.expenses && data.expenses.length > 0) {
      return TransactionType.Expense;
    }
    if (data.incomes && data.incomes.length > 0) {
      return TransactionType.Income;
    }
  };

  const formComponents = () => {
    return (
      <Stack spacing={2} marginBottom={2}>
        <TransactionFormFields
          data={data}
          onHandleChange={handleChange}
          onDescriptionChange={(value) => handleDescriptionChange(value)}
          onAmountChange={(value) => handleAmountChange(value)}
        ></TransactionFormFields>
        {getDetailComponents()}
      </Stack>
    );
  };

  const getDetailComponents = () => {
    if (getType() === TransactionType.Expense) {
      return (
        <EditableRows
          type={TransactionType.Expense}
          transaction={data}
          onHandleChange={handleRowChange}
          changedDescription={description}
          changedAmount={amount}
        ></EditableRows>
      );
    }
    if (getType() === TransactionType.Income) {
      return (
        <EditableRows
          type={TransactionType.Income}
          transaction={data}
          onHandleChange={handleRowChange}
          changedDescription={description}
          changedAmount={amount}
        ></EditableRows>
      );
    }
  };

  if (ready) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth={true} maxWidth={"lg"}>
        <DialogContent dividers>
          <AlisaContent headerText={t("transaction")}>
            <AlisaFormHandler<TransactionInputDto>
              id={id}
              dataService={dataService}
              data={data}
              formComponents={formComponents()}
              onSetData={setData}
              translation={{
                cancelButton: t("cancel"),
                submitButton: t("save"),
                validationMessageTitle: t("validationErrorTitle"),
              }}
              onCancel={onCancel}
              onAfterSubmit={onAfterSubmit}
            ></AlisaFormHandler>
          </AlisaContent>
        </DialogContent>
      </Dialog>
    );
  } else {
    return <AlisaLoadingProgress></AlisaLoadingProgress>;
  }
}

export default withTranslation(transactionContext.name)(TransactionForm);
