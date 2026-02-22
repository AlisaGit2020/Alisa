import { Box, IconButton, MenuItem, TextField } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { TFunction } from "i18next";
import {
  AllocationCondition,
  AllocationConditionField,
  AllocationConditionOperator,
} from "@alisa-types";

interface AllocationConditionRowProps {
  condition: AllocationCondition;
  index: number;
  t: TFunction;
  onChange: (index: number, condition: AllocationCondition) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
}

const FIELDS: AllocationConditionField[] = [
  "sender",
  "receiver",
  "description",
  "amount",
];

const TEXT_OPERATORS: AllocationConditionOperator[] = ["equals", "contains"];
const AMOUNT_OPERATORS: AllocationConditionOperator[] = [
  "equals",
  "greaterThan",
  "lessThan",
];

function AllocationConditionRow({
  condition,
  index,
  t,
  onChange,
  onRemove,
  showRemove,
}: AllocationConditionRowProps) {
  const operators =
    condition.field === "amount" ? AMOUNT_OPERATORS : TEXT_OPERATORS;

  const handleFieldChange = (value: AllocationConditionField) => {
    const newOperators = value === "amount" ? AMOUNT_OPERATORS : TEXT_OPERATORS;
    const newOperator = newOperators.includes(condition.operator)
      ? condition.operator
      : newOperators[0];

    onChange(index, {
      ...condition,
      field: value,
      operator: newOperator,
    });
  };

  const handleOperatorChange = (value: AllocationConditionOperator) => {
    onChange(index, {
      ...condition,
      operator: value,
    });
  };

  const handleValueChange = (value: string) => {
    onChange(index, {
      ...condition,
      value,
    });
  };

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
      <TextField
        select
        size="small"
        label={t("allocation:field")}
        value={condition.field}
        onChange={(e) =>
          handleFieldChange(e.target.value as AllocationConditionField)
        }
        sx={{ minWidth: 120 }}
      >
        {FIELDS.map((field) => (
          <MenuItem key={field} value={field}>
            {t(`allocation:field.${field}`)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label={t("allocation:operator")}
        value={condition.operator}
        onChange={(e) =>
          handleOperatorChange(e.target.value as AllocationConditionOperator)
        }
        sx={{ minWidth: 120 }}
      >
        {operators.map((op) => (
          <MenuItem key={op} value={op}>
            {t(`allocation:operator.${op}`)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        size="small"
        label={t("allocation:value")}
        value={condition.value}
        onChange={(e) => handleValueChange(e.target.value)}
        type={condition.field === "amount" ? "number" : "text"}
        sx={{ flexGrow: 1 }}
      />

      {showRemove && (
        <IconButton
          size="small"
          onClick={() => onRemove(index)}
          aria-label={t("common:delete")}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}

export default AllocationConditionRow;
