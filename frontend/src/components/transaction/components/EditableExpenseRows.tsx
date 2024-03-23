import { WithTranslation, withTranslation } from "react-i18next";
import {
  expenseContext,
  expenseTypeContext,
  transactionContext,
} from "@alisa-lib/alisa-contexts.ts";
import { IconButton } from "@mui/material";
import { ExpenseInputDto } from "@alisa-backend/accounting/expense/dtos/expense-input.dto.ts";
import React from "react";
import DataService from "@alisa-lib/data-service.ts";
import AlisaSelect from "../../alisa/AlisaSelect.tsx";
import { ExpenseType } from "@alisa-backend/accounting/expense/entities/expense-type.entity.ts";
import Title from "../../../Title.tsx";
import Box from "@mui/material/Box";
import { TransactionInputDto } from "@alisa-backend/accounting/transaction/dtos/transaction-input.dto.ts";
import AddIcon from "@mui/icons-material/Add";
import RowDataFields from "./RowDataFields.tsx";

interface EditableExpenseRowsProps extends WithTranslation {
  transaction: TransactionInputDto;
  onHandleChange: (expenses: ExpenseInputDto[]) => void;
  changedDescription: string;
  changedAmount: number;
}
function EditableExpenseRows(props: EditableExpenseRowsProps) {
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
      <RowDataFields<ExpenseInputDto>
        typeSelect={
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
        }
        data={expense}
        index={index}
        onHandleChange={handleChange}
        onCalculateAmount={calculateAmount}
        onRemoveRow={removeExpense}
        t={props.t}
      ></RowDataFields>
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

export default withTranslation(transactionContext.name)(EditableExpenseRows);
