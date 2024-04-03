import { WithTranslation, withTranslation } from "react-i18next";
import {
  expenseContext,
  expenseTypeContext,
  incomeContext,
  incomeTypeContext,
  transactionContext,
} from "@alisa-lib/alisa-contexts.ts";
import { IconButton } from "@mui/material";
import { ExpenseInputDto } from "@alisa-backend/accounting/expense/dtos/expense-input.dto.ts";
import React from "react";
import DataService from "@alisa-lib/data-service.ts";
import AlisaSelect from "../../alisa/data/AlisaSelect.tsx";
import { ExpenseType } from "@alisa-backend/accounting/expense/entities/expense-type.entity.ts";
import Title from "../../../Title.tsx";
import Box from "@mui/material/Box";
import { TransactionInputDto } from "@alisa-backend/accounting/transaction/dtos/transaction-input.dto.ts";
import AddIcon from "@mui/icons-material/Add";
import RowDataFields from "./RowDataFields.tsx";
import { TransactionRow } from "@alisa-lib/types.ts";
import { IncomeInputDto } from "@alisa-backend/accounting/income/dtos/income-input.dto.ts";
import { IncomeType } from "@alisa-backend/accounting/income/entities/income-type.entity.ts";
import { TransactionType } from "@alisa-backend/common/types.ts";

interface EditableRowsProps extends WithTranslation {
  transaction: TransactionInputDto;
  type: TransactionType;
  onHandleChange: (rows: ExpenseInputDto[] | IncomeInputDto[]) => void;
  changedDescription: string;
  changedAmount: number;
}
function EditableRows<T extends TransactionRow>(props: EditableRowsProps) {
  let initialData;
  if (props.type === TransactionType.EXPENSE) {
    initialData = props.transaction.expenses || [];
  } else {
    initialData = props.transaction.incomes || [];
  }
  const [data, setData] = React.useState<T[]>((initialData as T[]) || []);

  const hasRunInit = React.useRef(false);

  const dataService = new DataService<T>({
    context:
      props.type === TransactionType.EXPENSE ? expenseContext : incomeContext,
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
    //calculate all expenses total
    const expensesTotalAmount = data
      .map((expense) => expense.totalAmount)
      .reduce((a, b) => Number(a) + Number(b), 0);

    defaults.totalAmount = props.transaction.amount - expensesTotalAmount;
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

  const handleChange = (index: number, name: keyof T, value: T[keyof T]) => {
    if (data === undefined) {
      return;
    }
    data[index] = dataService.updateNestedData(
      data[index],
      name as string,
      value,
    );
    setData([...data]);
    props.onHandleChange(data);
  };

  const calculateAmount = (index: number) => {
    const expense = data[index];
    if (expense.quantity && expense.totalAmount) {
      const amount = Number(expense.totalAmount / expense.quantity);
      handleChange(index, "amount", amount as T[keyof T]);
    }
  };

  const getRowContent = (row: T, index: number) => {
    const handleExpenseTypeChange = (
      fieldName: keyof ExpenseInputDto,
      value: ExpenseInputDto[keyof ExpenseInputDto],
    ) => {
      handleChange(index, fieldName as keyof T, value as T[keyof T]);
    };

    const handleIncomeTypeChange = (
      fieldName: keyof IncomeInputDto,
      value: IncomeInputDto[keyof IncomeInputDto],
    ) => {
      handleChange(index, fieldName as keyof T, value as T[keyof T]);
    };

    const getTypeSelect = (row: T) => {
      if (props.type === TransactionType.EXPENSE) {
        return (
          <AlisaSelect<ExpenseInputDto, ExpenseType>
            label={props.t("expenseType")}
            dataService={
              new DataService<ExpenseType>({
                context: expenseTypeContext,
                fetchOptions: { order: { name: "ASC" } },
              })
            }
            fieldName="expenseTypeId"
            value={row.expenseTypeId}
            onHandleChange={handleExpenseTypeChange}
          ></AlisaSelect>
        );
      }

      if (props.type === TransactionType.INCOME) {
        return (
          <AlisaSelect<IncomeInputDto, IncomeType>
            label={props.t("incomeType")}
            dataService={
              new DataService<IncomeType>({
                context: incomeTypeContext,
                fetchOptions: { order: { name: "ASC" } },
              })
            }
            fieldName="incomeTypeId"
            value={row.incomeTypeId}
            onHandleChange={handleIncomeTypeChange}
          ></AlisaSelect>
        );
      }
    };

    return (
      <RowDataFields<T>
        key={index}
        typeSelect={getTypeSelect(row)}
        data={row}
        index={index}
        onHandleChange={handleChange}
        onCalculateAmount={calculateAmount}
        onRemoveRow={removeExpense}
        t={props.t}
      ></RowDataFields>
    );
  };

  const getRows = () => {
    return data?.map((item: T, index: number) => getRowContent(item, index));
  };

  if (data?.length === 0) {
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

export default withTranslation(transactionContext.name)(EditableRows);
