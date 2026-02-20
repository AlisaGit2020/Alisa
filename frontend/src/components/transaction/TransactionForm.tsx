import { Stack } from "@mui/material";
import React, { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { expenseTypeContext, transactionContext } from "@alisa-lib/alisa-contexts";
import AlisaFormHandler from "../alisa/form/AlisaFormHandler";
import DataService from "@alisa-lib/data-service";
import {
  TransactionInput,
  ExpenseInput,
  IncomeInput,
  TransactionStatus,
  TransactionType,
  TransactionTypeName,
  transactionTypeNames,
  ExpenseType,
} from "@alisa-types";
import AlisaLoadingProgress from "../alisa/AlisaLoadingProgress";
import TransactionFormFields from "./components/TransactionFormFields";
import EditableRows from "./components/EditableRows.tsx";
import ApiClient from "@alisa-lib/api-client.ts";
import {
  isLoanPaymentMessage,
  parseLoanPaymentMessage,
} from "@alisa-lib/loan-message-parser.ts";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import { AlisaButton, AlisaDialog } from "../alisa";

interface TransactionFormProps extends WithTranslation {
  id?: number;
  open: boolean;
  propertyId?: number;
  status?: TransactionStatus;
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
  status,
  type,
  onAfterSubmit,
  onCancel,
  onClose,
}: TransactionFormProps) {
  const [data, setData] = useState<TransactionInput>(
    {} as TransactionInput,
  );
  const [ready, setReady] = useState<boolean>(false);

  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);

  const dataService = new DataService<TransactionInput>({
    context: transactionContext,
    relations: { expenses: true, incomes: true },
  });

  React.useEffect(() => {
    const getDefaults = async () => {
      const user = await ApiClient.me();
      const defaults = {} as TransactionInput;
      defaults.status = status;
      defaults.type = type;
      if (
        type === TransactionType.EXPENSE ||
        type === TransactionType.WITHDRAW
      ) {
        defaults.sender = user.firstName + " " + user.lastName;
      }
      if (type === TransactionType.INCOME || type === TransactionType.DEPOSIT) {
        defaults.receiver = user.firstName + " " + user.lastName;
      }
      if (propertyId) {
        defaults.propertyId = propertyId;
      }
      return defaults;
    };

    if (id === undefined) {
      const fetchData = async () => {
        return await getDefaults();
      };

      fetchData().then((data) => {
        setData(data);
        setReady(true);
      });
    } else {
      setReady(true);
    }
  }, [id, propertyId, status, type]);

  // Load expense types for loan payment splitting
  React.useEffect(() => {
    const loadExpenseTypes = async () => {
      const expenseTypeService = new DataService<ExpenseType>({
        context: expenseTypeContext,
      });
      const types = await expenseTypeService.search();
      setExpenseTypes(types);
    };
    loadExpenseTypes();
  }, []);

  const findExpenseTypeByKeyword = (
    ...keywords: string[]
  ): ExpenseType | undefined => {
    // Try exact match first
    for (const keyword of keywords) {
      const exact = expenseTypes.find(
        (et) => et.name.toLowerCase() === keyword.toLowerCase()
      );
      if (exact) return exact;
    }
    // Then try partial match (contains keyword)
    for (const keyword of keywords) {
      const partial = expenseTypes.find((et) =>
        et.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (partial) return partial;
    }
    return undefined;
  };

  const canSplitLoanPayment = (): boolean => {
    // Can only split if:
    // 1. Transaction is pending
    // 2. Description matches loan payment pattern
    // 3. Transaction doesn't already have multiple expenses
    if (data.status !== TransactionStatus.PENDING) return false;
    if (!data.description) return false;
    if (!isLoanPaymentMessage(data.description)) return false;
    if (data.expenses && data.expenses.length > 1) return false;
    return true;
  };

  const handleSplitLoanPayment = async () => {
    const loanComponents = parseLoanPaymentMessage(data.description);
    if (!loanComponents) return;

    // Find expense types by name or use user's configured defaults
    const user = await ApiClient.me();

    const principalType =
      expenseTypes.find((et) => et.id === user.loanPrincipalExpenseTypeId) ||
      findExpenseTypeByKeyword("Lainan lyhennys", "lyhennys");
    const interestType =
      expenseTypes.find((et) => et.id === user.loanInterestExpenseTypeId) ||
      findExpenseTypeByKeyword("Lainan korko", "korko");
    const handlingFeeType =
      expenseTypes.find((et) => et.id === user.loanHandlingFeeExpenseTypeId) ||
      findExpenseTypeByKeyword("Lainakulut", "lainakulu", "pankkikulu", "kulu");

    const expenses: ExpenseInput[] = [];

    // Principal (Lyhennys)
    if (loanComponents.principal > 0) {
      expenses.push({
        description: t("loanPrincipal"),
        amount: loanComponents.principal,
        quantity: 1,
        totalAmount: loanComponents.principal,
        expenseTypeId: principalType?.id,
      });
    }

    // Interest (Korko)
    if (loanComponents.interest > 0) {
      expenses.push({
        description: t("loanInterest"),
        amount: loanComponents.interest,
        quantity: 1,
        totalAmount: loanComponents.interest,
        expenseTypeId: interestType?.id,
      });
    }

    // Handling fee (Kulut)
    if (loanComponents.handlingFee > 0) {
      expenses.push({
        description: t("loanHandlingFee"),
        amount: loanComponents.handlingFee,
        quantity: 1,
        totalAmount: loanComponents.handlingFee,
        expenseTypeId: handlingFeeType?.id,
      });
    }

    // Update the transaction with expenses and set type to EXPENSE
    const newData = { ...data };
    newData.type = TransactionType.EXPENSE;
    newData.expenses = expenses;
    setData(newData);
  };

  const handleChange = async (name: string, value: unknown) => {
    let newData = dataService.updateNestedData(data, name, value);

    if (name === "transactionDate") {
      newData = dataService.updateNestedData(newData, "accountingDate", value);
    }
    if (name === "type") {
      newData = handleTypeChange(value as TransactionType, newData);
    }
    setData(newData);
  };

  const handleTypeChange = (
    value: TransactionType,
    newData: TransactionInput,
  ) => {
    if (value !== TransactionType.INCOME) {
      newData.incomes = undefined;
    }
    if (value !== TransactionType.EXPENSE) {
      newData.expenses = undefined;
    }

    //Flip amount sign if type is changed
    if (value === TransactionType.INCOME || value === TransactionType.DEPOSIT) {
      if (newData.amount < 0) {
        const newAmount = newData.amount * -1;
        newData.amount = newAmount;
        handleAmountChange(newAmount);
      }
    }
    if (
      value === TransactionType.EXPENSE ||
      value === TransactionType.WITHDRAW
    ) {
      if (newData.amount > 0) {
        const newAmount = newData.amount * -1;
        newData.amount = newAmount;
        handleAmountChange(newAmount);
      }
    }
    return newData;
  };

  const handleRowChange = (
    rows: ExpenseInput[] | IncomeInput[],
  ) => {
    const transactionType = getType();

    // Calculate total from rows
    const rowsTotal = rows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);

    // For EXPENSE/WITHDRAW, amount should be negative
    const transactionAmount = (transactionType === TransactionType.EXPENSE || transactionType === TransactionType.WITHDRAW)
      ? -Math.abs(rowsTotal)
      : Math.abs(rowsTotal);

    // Use functional state update to ensure we don't lose expense row data
    // Bug fix for issue #84: Previously, sequential handleChange calls would
    // cause stale state issues where expense row type and description were lost
    setData(prev => {
      let newData = { ...prev };

      if (transactionType === TransactionType.EXPENSE) {
        newData.expenses = rows as ExpenseInput[];
      } else {
        newData.incomes = rows as IncomeInput[];
      }

      // Update transaction amount to match rows total
      if (rowsTotal !== 0) {
        newData.amount = transactionAmount;
      }

      return newData;
    });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
  };

  const handleAmountChange = (value: number) => {
    setAmount(value);

    // Sync the first expense/income row amount with transaction amount
    // This ensures the data is consistent when saved, without waiting for effects
    const transactionType = getType();
    const absValue = Math.abs(Number(value) || 0);

    if (transactionType === TransactionType.EXPENSE && data.expenses?.length) {
      // Only update if the first row appears to be in default state (amount === 0)
      if (data.expenses[0].amount === 0) {
        const updatedExpenses = [...data.expenses];
        updatedExpenses[0] = {
          ...updatedExpenses[0],
          totalAmount: absValue,
          amount: absValue / (updatedExpenses[0].quantity || 1),
        };
        setData(prev => ({ ...prev, expenses: updatedExpenses }));
      }
    } else if (transactionType === TransactionType.INCOME && data.incomes?.length) {
      if (data.incomes[0].amount === 0) {
        const updatedIncomes = [...data.incomes];
        updatedIncomes[0] = {
          ...updatedIncomes[0],
          totalAmount: absValue,
          amount: absValue / (updatedIncomes[0].quantity || 1),
        };
        setData(prev => ({ ...prev, incomes: updatedIncomes }));
      }
    }
  };

  const getType = (): TransactionType | undefined => {
    if (type !== undefined) {
      return type;
    }

    return data.type;
  };

  const getTypeName = (): TransactionTypeName => {
    const type = getType();
    if (type === undefined) {
      return TransactionTypeName.DEPOSIT;
    }
    const typeName = transactionTypeNames.get(type);
    if (typeName === undefined) {
      return TransactionTypeName.DEPOSIT;
    }
    return typeName;
  };

  const renderFormContent = (fieldErrors: Partial<Record<keyof TransactionInput, string>>) => {
    return (
      <Stack spacing={2} marginBottom={2}>
        <TransactionFormFields
          data={data}
          fieldErrors={fieldErrors}
          onHandleChange={handleChange}
          onDescriptionChange={(value) => handleDescriptionChange(value)}
          onAmountChange={(value) => handleAmountChange(value)}
        ></TransactionFormFields>
        {canSplitLoanPayment() && (
          <AlisaButton
            label={t("splitLoanPayment")}
            variant="outlined"
            startIcon={<CallSplitIcon />}
            onClick={handleSplitLoanPayment}
          />
        )}
        {getDetailComponents()}
      </Stack>
    );
  };

  const getDetailComponents = () => {
    if (getType() === TransactionType.EXPENSE) {
      return (
        <EditableRows
          type={TransactionType.EXPENSE}
          transaction={data}
          onHandleChange={handleRowChange}
          changedDescription={description}
          changedAmount={amount}
        ></EditableRows>
      );
    }
    if (getType() === TransactionType.INCOME) {
      return (
        <EditableRows
          type={TransactionType.INCOME}
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
      <AlisaDialog
        open={open}
        title={`${t("transaction")} - ${t(getTypeName())}`}
        maxWidth="lg"
        onClose={onClose}
      >
        <AlisaFormHandler<TransactionInput>
          id={id}
          dataService={dataService}
          data={data}
          renderForm={renderFormContent}
          onSetData={setData}
          validationRules={{
            sender: { required: true },
            receiver: { required: true },
            description: { required: true },
            amount: { required: true },
            transactionDate: { required: true },
            accountingDate: { required: true },
          }}
          translation={{
            cancelButton: t("cancel"),
            submitButton: t("save"),
            validationMessageTitle: t("validationErrorTitle"),
          }}
          onCancel={onCancel}
          onAfterSubmit={onAfterSubmit}
        />
      </AlisaDialog>
    );
  } else {
    return <AlisaLoadingProgress></AlisaLoadingProgress>;
  }
}

export default withTranslation(transactionContext.name)(TransactionForm);
