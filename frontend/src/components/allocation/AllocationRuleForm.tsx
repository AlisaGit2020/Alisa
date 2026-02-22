import React from "react";
import { Box, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { TFunction } from "i18next";
import AlisaTextField from "../alisa/form/AlisaTextField";
import AlisaSelectField, {
  AlisaSelectFieldItem,
} from "../alisa/form/AlisaSelectField";
import AlisaButton from "../alisa/form/AlisaButton";
import AlisaSwitch from "../alisa/form/AlisaSwitch";
import AllocationConditionRow from "./AllocationConditionRow";
import {
  AllocationCondition,
  AllocationRule,
  TransactionType,
} from "@alisa-types";

interface AllocationRuleFormProps {
  rule: Partial<AllocationRule>;
  expenseTypes: AlisaSelectFieldItem[];
  incomeTypes: AlisaSelectFieldItem[];
  t: TFunction;
  onChange: (rule: Partial<AllocationRule>) => void;
  errors?: {
    name?: string;
    conditions?: string;
  };
}

const TRANSACTION_TYPES: AlisaSelectFieldItem[] = [
  { id: TransactionType.EXPENSE, key: "expense" },
  { id: TransactionType.INCOME, key: "income" },
  { id: TransactionType.DEPOSIT, key: "deposit" },
  { id: TransactionType.WITHDRAW, key: "withdraw" },
];

function AllocationRuleForm({
  rule,
  expenseTypes,
  incomeTypes,
  t,
  onChange,
  errors,
}: AllocationRuleFormProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...rule, name: e.target.value });
  };

  const handleTransactionTypeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newType = Number(e.target.value) as TransactionType;
    onChange({
      ...rule,
      transactionType: newType,
      expenseTypeId:
        newType === TransactionType.EXPENSE ? rule.expenseTypeId : null,
      incomeTypeId:
        newType === TransactionType.INCOME ? rule.incomeTypeId : null,
    });
  };

  const handleExpenseTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...rule, expenseTypeId: Number(e.target.value) || null });
  };

  const handleIncomeTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...rule, incomeTypeId: Number(e.target.value) || null });
  };

  const handleConditionChange = (
    index: number,
    condition: AllocationCondition
  ) => {
    const newConditions = [...(rule.conditions || [])];
    newConditions[index] = condition;
    onChange({ ...rule, conditions: newConditions });
  };

  const handleConditionRemove = (index: number) => {
    const newConditions = (rule.conditions || []).filter((_, i) => i !== index);
    onChange({ ...rule, conditions: newConditions });
  };

  const handleAddCondition = () => {
    const newCondition: AllocationCondition = {
      field: "description",
      operator: "contains",
      value: "",
    };
    onChange({ ...rule, conditions: [...(rule.conditions || []), newCondition] });
  };

  const handleActiveChange = (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    onChange({ ...rule, isActive: checked });
  };

  const showExpenseType =
    rule.transactionType === TransactionType.EXPENSE &&
    expenseTypes.length > 0;
  const showIncomeType =
    rule.transactionType === TransactionType.INCOME && incomeTypes.length > 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <AlisaTextField
        label={t("allocation:ruleName")}
        value={rule.name || ""}
        onChange={handleNameChange}
        error={!!errors?.name}
        helperText={errors?.name}
      />

      <AlisaSelectField
        label={t("allocation:transactionType")}
        value={rule.transactionType ?? ""}
        items={TRANSACTION_TYPES}
        onChange={handleTransactionTypeChange}
        t={t}
        translateKeyPrefix="transaction"
      />

      {showExpenseType && (
        <AlisaSelectField
          label={t("allocation:expenseType")}
          value={rule.expenseTypeId ?? ""}
          items={expenseTypes}
          onChange={handleExpenseTypeChange}
          t={t}
          translateKeyPrefix="expense-type"
        />
      )}

      {showIncomeType && (
        <AlisaSelectField
          label={t("allocation:incomeType")}
          value={rule.incomeTypeId ?? ""}
          items={incomeTypes}
          onChange={handleIncomeTypeChange}
          t={t}
          translateKeyPrefix="income-type"
        />
      )}

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("allocation:conditions")}
        </Typography>

        {errors?.conditions && (
          <Typography variant="caption" color="error" sx={{ mb: 1 }}>
            {errors.conditions}
          </Typography>
        )}

        {(rule.conditions || []).map((condition, index) => (
          <AllocationConditionRow
            key={index}
            condition={condition}
            index={index}
            t={t}
            onChange={handleConditionChange}
            onRemove={handleConditionRemove}
            showRemove={(rule.conditions?.length || 0) > 1}
          />
        ))}

        <AlisaButton
          label={t("allocation:addCondition")}
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddCondition}
        />
      </Box>

      <AlisaSwitch
        label={t("allocation:active")}
        value={rule.isActive ?? true}
        onChange={handleActiveChange}
      />
    </Box>
  );
}

export default AllocationRuleForm;
