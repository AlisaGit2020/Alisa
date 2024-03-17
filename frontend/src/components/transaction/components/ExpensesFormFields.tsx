import { WithTranslation, withTranslation } from "react-i18next";
import {
  expenseContext,
  expenseTypeContext,
  transactionContext,
} from "@alisa-lib/alisa-contexts.ts";
import { Button, Grid, IconButton, Stack } from "@mui/material";
import AlisaNumberField from "../../alisa/form/AlisaNumberField.tsx";
import { ExpenseInputDto } from "@alisa-backend/accounting/expense/dtos/expense-input.dto.ts";
import React from "react";
import DataService from "@alisa-lib/data-service.ts";
import DeleteIcon from "@mui/icons-material/Delete";
import AlisaSelect from "../../alisa/AlisaSelect.tsx";
import { ExpenseType } from "@alisa-backend/accounting/expense/entities/expense-type.entity.ts";
import AlisaTextField from "../../alisa/form/AlisaTextField.tsx";
import Title from "../../../Title.tsx";
import Box from "@mui/material/Box";
import { TransactionInputDto } from "@alisa-backend/accounting/transaction/dtos/transaction-input.dto.ts";

interface ExpenseFormFieldsProps extends WithTranslation {
  transaction: TransactionInputDto;
  onHandleChange: (expenses: ExpenseInputDto[]) => void;
}
function ExpensesFormFields(props: ExpenseFormFieldsProps) {
  const [data, setData] = React.useState<ExpenseInputDto[]>(
    props.transaction?.expenses || [],
  );

  const hasRunInit = React.useRef(false);

  const dataService = new DataService<ExpenseInputDto>({
    context: expenseContext,
    dataValidateInstance: new ExpenseInputDto(),
  });

  React.useEffect(() => {
    if (!hasRunInit.current) {
      const addExpenseIfEmpty = async () => {
        if (data.length === 0) {
          await addExpense();
        }
      };
      addExpenseIfEmpty().then();
      hasRunInit.current = true;
    }
  }, []);

  const addExpense = async () => {
    const defaults = await dataService.getDefaults();
    data.push(defaults);
    setData([...data]);
  };

  const removeExpense = (index: number) => {
    if (data.length <= 1) {
      return;
    }
    data.splice(index, 1);
    setData([...data]);
    props.onHandleChange(data);
  };

  const getDescriptionValue = (index: number, expense: ExpenseInputDto) => {
    if (index === 0 && !expense.description) {
      return props.transaction.description;
    }
    return expense.description;
  };

  const getTotalAmountValue = (index: number, expense: ExpenseInputDto) => {
    if (index === 0 && expense.totalAmount === 0) {
      return props.transaction.amount;
    }
    return expense.totalAmount;
  };

  const handleChange = (
    index: number,
    name: keyof ExpenseInputDto,
    value: ExpenseInputDto[keyof ExpenseInputDto],
  ) => {
    if (data === undefined) {
      return;
    }
    data[index] = dataService.updateNestedData(data[index], name, value);
    setData([...data]);
    props.onHandleChange(data);
  };

  const getRowContent = (expense: ExpenseInputDto, index: number) => {
    const handleExpenseTypeChange = (
      name: keyof ExpenseInputDto,
      expenseTypeId: ExpenseInputDto[keyof ExpenseInputDto],
    ) => {
      handleChange(index, name, expenseTypeId);
    };
    return (
      <Grid container spacing={0} rowSpacing={0}>
        <Grid container spacing={1} height={80}>
          <Grid item xs={2}>
            <AlisaSelect<ExpenseInputDto, ExpenseType>
              label={props.t("expenseType")}
              dataService={
                new DataService<ExpenseType>({
                  context: expenseTypeContext,
                  fetchOptions: { order: { name: "ASC" } },
                })
              }
              fieldName="expenseTypeId"
              value={expense.expenseTypeId}
              onHandleChange={handleExpenseTypeChange}
            ></AlisaSelect>
          </Grid>
          <Grid item xs={4}>
            <AlisaTextField
              label={props.t("description")}
              value={getDescriptionValue(index, expense)}
              autoComplete="off"
              onChange={(e) =>
                handleChange(index, "description", e.target.value)
              }
            />
          </Grid>
          <Grid item xs={6}>
            <Stack direction={"row"} spacing={1}>
              <AlisaNumberField
                disabled={true}
                label={props.t("amount")}
                value={expense.amount}
                onChange={(e) => handleChange(index, "amount", e.target.value)}
                adornment="€"
              />
              <AlisaNumberField
                label={props.t("quantity")}
                value={expense.quantity}
                onChange={(e) =>
                  handleChange(index, "quantity", e.target.value)
                }
              />
              <AlisaNumberField
                label={props.t("totalAmount")}
                value={getTotalAmountValue(index, expense)}
                autoComplete="off"
                onChange={(e) =>
                  handleChange(index, "totalAmount", e.target.value)
                }
                adornment="€"
              />
              <IconButton
                onClick={() => removeExpense(index)}
                title={props.t("delete")}
              >
                <DeleteIcon></DeleteIcon>
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      </Grid>
    );
  };

  const getRows = () => {
    return data.map((item: ExpenseInputDto, index: number) =>
      getRowContent(item, index),
    );
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <>
      <Box sx={{ padding: 0 }}>
        <Title>{props.t("rows")}</Title>
        {getRows()}
        <Button onClick={addExpense} variant={"contained"}>
          {props.t("add", { ns: "expense" })}
        </Button>
      </Box>
    </>
  );
}

export default withTranslation(transactionContext.name)(ExpensesFormFields);
