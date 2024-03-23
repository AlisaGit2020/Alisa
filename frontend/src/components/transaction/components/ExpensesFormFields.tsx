import { WithTranslation, withTranslation } from "react-i18next";
import {
  expenseContext,
  expenseTypeContext,
  transactionContext,
} from "@alisa-lib/alisa-contexts.ts";
import { Grid, IconButton, Stack } from "@mui/material";
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
import AddIcon from "@mui/icons-material/Add";

interface ExpenseFormFieldsProps extends WithTranslation {
  transaction: TransactionInputDto;
  onHandleChange: (expenses: ExpenseInputDto[]) => void;
  changedDescription: string;
  changedAmount: number;
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

  React.useEffect(() => {
    if (props.changedDescription !== "") {
      if (data.length > 0 && data[0].description === "") {
        data[0].description = props.changedDescription;
        setData([...data]);
        props.onHandleChange(data);
      }
    }
  }, [props.changedDescription]);

  React.useEffect(() => {
    if (props.changedAmount !== 0) {
      if (data.length > 0 && data[0].amount === 0) {
        data[0].totalAmount = props.changedAmount;
        setData([...data]);
        props.onHandleChange(data);
      }
    }
  }, [props.changedAmount]);

  const addExpense = async () => {
    const defaults = await dataService.getDefaults();
    data.push(defaults);
    setData([...data]);
    props.onHandleChange(data);
  };

  const removeExpense = (index: number) => {
    if (data.length <= 1) {
      return;
    }
    data.splice(index, 1);
    setData([...data]);
    props.onHandleChange(data);
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

  const calculateAmount = (index: number) => {
    const expense = data[index];
    if (expense.quantity && expense.totalAmount) {
      const amount = expense.totalAmount / expense.quantity;
      handleChange(index, "amount", amount);
    }
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
              value={expense.description}
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
                onBlur={() => calculateAmount(index)}
              />
              <AlisaNumberField
                label={props.t("totalAmount")}
                value={expense.totalAmount}
                autoComplete="off"
                onChange={(e) =>
                  handleChange(index, "totalAmount", e.target.value)
                }
                onBlur={() => calculateAmount(index)}
                adornment="€"
              />
              <IconButton
                onClick={() => removeExpense(index)}
                title={props.t("delete")}
              >
                <DeleteIcon color={"secondary"}></DeleteIcon>
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      </Grid>
    );
  };

  const getRows = () => {
    return props.transaction?.expenses?.map(
      (item: ExpenseInputDto, index: number) => getRowContent(item, index),
    );
  };

  if (props.transaction?.expenses?.length === 0) {
    return null;
  }

  return (
    <>
      <Box sx={{ padding: 0 }}>
        <Title>{props.t("rows")}</Title>
        <Box marginTop={2}>{getRows()}</Box>
        <Box display="flex" sx={{ justifyContent: "flex-start" }}>
          <IconButton
            onClick={addExpense}
            title={props.t("add", { ns: "expense" })}
          >
            <AddIcon color={"primary"}></AddIcon>
          </IconButton>
        </Box>
      </Box>
    </>
  );
}

export default withTranslation(transactionContext.name)(ExpensesFormFields);
