import { WithTranslation, withTranslation } from "react-i18next";
import {
  expenseContext,
  expenseTypeContext,
  incomeContext,
  incomeTypeContext,
  transactionContext,
} from "@alisa-lib/alisa-contexts.ts";
import { IconButton } from "@mui/material";
import {
  ExpenseInput,
  ExpenseType,
  TransactionInput,
  IncomeInput,
  IncomeType,
  TransactionType,
} from "@alisa-types";
import React from "react";
import DataService from "@alisa-lib/data-service.ts";
import AlisaSelect from "../../alisa/data/AlisaSelect.tsx";
import Title from "../../../Title.tsx";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import RowDataFields from "./RowDataFields.tsx";
import { TransactionRow } from "@alisa-lib/types.ts";

interface EditableRowsProps extends WithTranslation {
  transaction: TransactionInput;
  type: TransactionType;
  onHandleChange: (rows: ExpenseInput[] | IncomeInput[]) => void;
  changedDescription: string;
  changedAmount: number;
}
function EditableRows<T extends TransactionRow>(props: EditableRowsProps) {
  const { type: propsType, transaction, onHandleChange } = props;
  let initialData;
  if (propsType === TransactionType.EXPENSE) {
    initialData = transaction.expenses || [];
  } else {
    initialData = transaction.incomes || [];
  }
  const [data, setData] = React.useState<T[]>((initialData as T[]) || []);
  const hasRunInit = React.useRef(false);
  const [type, setType] = React.useState<TransactionType>(propsType);

  const dataService = React.useMemo(() => new DataService<T>({
    context:
      propsType === TransactionType.EXPENSE ? expenseContext : incomeContext,
  }), [propsType]);

  // Define helper functions before useEffect to avoid accessing before declaration
  const typeHasChanged = React.useCallback(() => {
    return type !== propsType;
  }, [type, propsType]);

  const addNewRow = React.useCallback(async () => {
    const defaults = await dataService.getDefaults();
    setData((prevData) => {
      //calculate all rows total
      const rowsTotalAmount = prevData
        .map((row) => row.totalAmount)
        .reduce((a, b) => Number(a) + Number(b), 0);

      defaults.totalAmount = transaction.amount - rowsTotalAmount;

      const newData = [...prevData, defaults];
      onHandleChange(newData);
      return newData;
    });
  }, [dataService, transaction.amount, onHandleChange]);

  React.useEffect(() => {
    if (!hasRunInit.current) {
      const addRowIfEmpty = async () => {
        if (data.length === 0) {
          await addNewRow();
        }
      };

      addRowIfEmpty().then();
      hasRunInit.current = true;
    } else {
      if (typeHasChanged()) {
        const setNewType = async () => {
          setType(propsType);
          setData([]);
          await addNewRow();
        };

        setNewType().then();
      }
    }
    // data.length is intentionally not in deps - we only check it during initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propsType, typeHasChanged, addNewRow]);

  React.useEffect(() => {
    if (props.changedDescription !== "") {
      setData((prevData) => {
        if (prevData.length > 0 && prevData[0].description === "") {
          const newData = [...prevData];
          newData[0] = { ...newData[0], description: props.changedDescription };
          props.onHandleChange(newData);
          return newData;
        }
        return prevData;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.changedDescription]);

  React.useEffect(() => {
    if (props.changedAmount !== 0) {
      setData((prevData) => {
        if (prevData.length > 0 && prevData[0].amount === 0) {
          const newData = [...prevData];
          newData[0] = { ...newData[0], totalAmount: props.changedAmount };
          props.onHandleChange(newData);
          return newData;
        }
        return prevData;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.changedAmount]);

  const removeRow = (index: number) => {
    if (data.length <= 1) {
      return;
    }
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
    props.onHandleChange(newData);
  };

  const handleChange = (index: number, name: keyof T, value: T[keyof T]) => {
    if (data === undefined) {
      return;
    }
    const newData = [...data];
    newData[index] = dataService.updateNestedData(
      newData[index],
      name as string,
      value,
    );
    setData(newData);
    props.onHandleChange(newData);
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
      fieldName: keyof ExpenseInput,
      value: ExpenseInput[keyof ExpenseInput],
    ) => {
      handleChange(index, fieldName as keyof T, value as T[keyof T]);
    };

    const handleIncomeTypeChange = (
      fieldName: keyof IncomeInput,
      value: IncomeInput[keyof IncomeInput],
    ) => {
      handleChange(index, fieldName as keyof T, value as T[keyof T]);
    };

    const getTypeSelect = (row: T) => {
      if (props.type === TransactionType.EXPENSE) {
        return (
          <AlisaSelect<ExpenseInput, ExpenseType>
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
          <AlisaSelect<IncomeInput, IncomeType>
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
        onRemoveRow={removeRow}
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
            onClick={addNewRow}
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
