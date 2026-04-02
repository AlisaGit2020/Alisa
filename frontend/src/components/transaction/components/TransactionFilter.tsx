import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { transactionContext } from "@asset-lib/asset-contexts.ts";
import {
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  SxProps,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import ClearIcon from "@mui/icons-material/Clear";
import { TransactionType, transactionTypeNames } from "@asset-types";
import { AssetButton } from "../../asset";
import DataService from "@asset-lib/data-service.ts";
import {
  expenseTypeContext,
  incomeTypeContext,
} from "@asset-lib/asset-contexts.ts";
import { ExpenseType, IncomeType } from "@asset-types";

export type SearchField = "sender" | "receiver" | "description";

export interface TransactionFilterData {
  propertyId: number;
  transactionTypes: TransactionType[];
  expenseTypeIds: number[];
  incomeTypeIds: number[];
  startDate: Date | null;
  endDate: Date | null;
  searchText: string;
  searchField: SearchField;
}

interface TransactionFilterProps extends WithTranslation {
  sx?: SxProps<Theme>;
  marginTop?: number;
  open: boolean;
  data: TransactionFilterData;
  onTypeFilterChange: (
    transactionTypes: TransactionType[],
    expenseTypeIds: number[],
    incomeTypeIds: number[],
  ) => void;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onSearchTextChange: (searchText: string) => void;
  onSearchFieldChange: (searchField: SearchField) => void;
  onReset: () => void;
}

function TransactionFilter(props: TransactionFilterProps) {
  const transactionTypeOptions = Array.from(transactionTypeNames.entries()).map(
    ([key, value]) => ({
      id: key as TransactionType,
      name: props.t(value),
    }),
  );

  const [expenseTypes, setExpenseTypes] = React.useState<ExpenseType[]>([]);
  const [incomeTypes, setIncomeTypes] = React.useState<IncomeType[]>([]);

  const transactionTypes = props.data.transactionTypes || [];
  const expenseTypeIds = props.data.expenseTypeIds || [];
  const incomeTypeIds = props.data.incomeTypeIds || [];

  const hasExpense = transactionTypes.includes(TransactionType.EXPENSE);
  const hasIncome = transactionTypes.includes(TransactionType.INCOME);

  React.useEffect(() => {
    if (hasExpense && expenseTypes.length === 0) {
      new DataService<ExpenseType>({
        context: expenseTypeContext,
        fetchOptions: { order: { key: "ASC" } },
      })
        .search()
        .then(setExpenseTypes)
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasExpense]);

  React.useEffect(() => {
    if (hasIncome && incomeTypes.length === 0) {
      new DataService<IncomeType>({
        context: incomeTypeContext,
        fetchOptions: { order: { key: "ASC" } },
      })
        .search()
        .then(setIncomeTypes)
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasIncome]);

  // Encode selection as string tokens for the MUI Select value
  const selectedTokens: string[] = [
    ...transactionTypes.map((t) => `type:${t}`),
    ...expenseTypeIds.map((id) => `expense:${id}`),
    ...incomeTypeIds.map((id) => `income:${id}`),
  ];

  // Selection is handled via individual onClick handlers on MenuItems
  const handleSelectChange = () => {};

  const toggleTransactionType = (type: TransactionType) => {
    let newTypes: TransactionType[];
    let newExpenseIds = expenseTypeIds;
    let newIncomeIds = incomeTypeIds;

    if (transactionTypes.includes(type)) {
      newTypes = transactionTypes.filter((t) => t !== type);
      if (type === TransactionType.EXPENSE) newExpenseIds = [];
      if (type === TransactionType.INCOME) newIncomeIds = [];
    } else {
      newTypes = [...transactionTypes, type];
    }

    props.onTypeFilterChange(newTypes, newExpenseIds, newIncomeIds);
  };

  const toggleExpenseType = (id: number) => {
    let newTypes = transactionTypes;
    if (!hasExpense) {
      newTypes = [...transactionTypes, TransactionType.EXPENSE];
    }

    const newExpenseIds = expenseTypeIds.includes(id)
      ? expenseTypeIds.filter((i) => i !== id)
      : [...expenseTypeIds, id];

    props.onTypeFilterChange(newTypes, newExpenseIds, incomeTypeIds);
  };

  const toggleIncomeType = (id: number) => {
    let newTypes = transactionTypes;
    if (!hasIncome) {
      newTypes = [...transactionTypes, TransactionType.INCOME];
    }

    const newIncomeIds = incomeTypeIds.includes(id)
      ? incomeTypeIds.filter((i) => i !== id)
      : [...incomeTypeIds, id];

    props.onTypeFilterChange(newTypes, expenseTypeIds, newIncomeIds);
  };

  const getTypeFilterLabel = () => {
    if (selectedTokens.length === 0) {
      return props.t("dataNotSelected");
    }

    const parts: string[] = [];

    for (const type of transactionTypes) {
      const option = transactionTypeOptions.find((o) => o.id === type);
      const typeName = option ? option.name : "";

      if (type === TransactionType.EXPENSE && expenseTypeIds.length > 0) {
        const subNames = expenseTypeIds
          .map((id) => {
            const et = expenseTypes.find((e) => e.id === id);
            return et ? props.t(`expense-type:${et.key}`) : "";
          })
          .filter(Boolean)
          .join(", ");
        parts.push(`${typeName} (${subNames})`);
      } else if (type === TransactionType.INCOME && incomeTypeIds.length > 0) {
        const subNames = incomeTypeIds
          .map((id) => {
            const it = incomeTypes.find((i) => i.id === id);
            return it ? props.t(`income-type:${it.key}`) : "";
          })
          .filter(Boolean)
          .join(", ");
        parts.push(`${typeName} (${subNames})`);
      } else {
        parts.push(typeName);
      }
    }

    return parts.join(", ");
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return dayjs(date).format("DD.MM.YYYY");
  };

  const getFilterSummary = (): string[] => {
    const filters: string[] = [];

    if (transactionTypes.length > 0) {
      filters.push(`${props.t("transactionType")}: ${getTypeFilterLabel()}`);
    }

    if (props.data.startDate || props.data.endDate) {
      const startStr = formatDate(props.data.startDate) || "";
      const endStr = formatDate(props.data.endDate) || "";
      if (startStr && endStr) {
        filters.push(`${startStr} - ${endStr}`);
      } else if (startStr) {
        filters.push(`${props.t("startDate")}: ${startStr}`);
      } else if (endStr) {
        filters.push(`${props.t("endDate")}: ${endStr}`);
      }
    }

    if (props.data.searchText) {
      filters.push(
        `${props.t(props.data.searchField)}: "${props.data.searchText}"`,
      );
    }

    return filters;
  };

  const filterSummary = getFilterSummary();

  return (
    <Paper
      sx={{
        display: props.open ? "block" : "none",
        marginTop: props.marginTop,
        padding: 2,
        ...props.sx,
      }}
    >
      <Stack spacing={3}>
        <Stack direction={"row"} spacing={2} flexWrap="wrap" useFlexGap alignItems="flex-end">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{props.t("transactionType")}</InputLabel>
            <Select
              multiple
              value={selectedTokens}
              onChange={handleSelectChange}
              input={<OutlinedInput label={props.t("transactionType")} />}
              renderValue={getTypeFilterLabel}
            >
              {transactionTypeOptions.map((option) => {
                const isExpenseOption = option.id === TransactionType.EXPENSE;
                const isIncomeOption = option.id === TransactionType.INCOME;
                const isSelected = transactionTypes.includes(option.id);

                return [
                  <MenuItem
                    key={`type:${option.id}`}
                    value={`type:${option.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTransactionType(option.id);
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      indeterminate={
                        isSelected &&
                        ((isExpenseOption && expenseTypeIds.length > 0) ||
                          (isIncomeOption && incomeTypeIds.length > 0))
                      }
                    />
                    <ListItemText primary={option.name} />
                  </MenuItem>,

                  // Expense sub-items
                  ...(isExpenseOption && isSelected && expenseTypes.length > 0
                    ? expenseTypes.map((type) => (
                        <MenuItem
                          key={`expense:${type.id}`}
                          value={`expense:${type.id}`}
                          sx={{ pl: 6 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpenseType(type.id);
                          }}
                        >
                          <Checkbox
                            checked={expenseTypeIds.includes(type.id)}
                            size="small"
                          />
                          <ListItemText
                            primary={props.t(`expense-type:${type.key}`)}
                          />
                        </MenuItem>
                      ))
                    : []),

                  // Income sub-items
                  ...(isIncomeOption && isSelected && incomeTypes.length > 0
                    ? incomeTypes.map((type) => (
                        <MenuItem
                          key={`income:${type.id}`}
                          value={`income:${type.id}`}
                          sx={{ pl: 6 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleIncomeType(type.id);
                          }}
                        >
                          <Checkbox
                            checked={incomeTypeIds.includes(type.id)}
                            size="small"
                          />
                          <ListItemText
                            primary={props.t(`income-type:${type.key}`)}
                          />
                        </MenuItem>
                      ))
                    : []),
                ];
              })}
            </Select>
          </FormControl>

          <Stack direction={"row"} spacing={0.5} alignItems="center">
            <DatePicker
              label={props.t("startDate")}
              value={props.data.startDate ? dayjs(props.data.startDate) : null}
              onChange={(value) => {
                props.onStartDateChange(value ? value.toDate() : null);
              }}
              slotProps={{
                textField: { size: "small", sx: { width: 185 } },
                field: { clearable: true },
              }}
            />
            <Typography variant="body2" sx={{ px: 0.5 }}>
              -
            </Typography>
            <DatePicker
              label={props.t("endDate")}
              value={props.data.endDate ? dayjs(props.data.endDate) : null}
              onChange={(value) => {
                props.onEndDateChange(value ? value.toDate() : null);
              }}
              slotProps={{
                textField: { size: "small", sx: { width: 185 } },
                field: { clearable: true },
              }}
            />
          </Stack>

          <Stack direction={"row"} spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{props.t("searchField")}</InputLabel>
              <Select
                value={props.data.searchField}
                label={props.t("searchField")}
                onChange={(e) =>
                  props.onSearchFieldChange(e.target.value as SearchField)
                }
              >
                <MenuItem value="sender">{props.t("sender")}</MenuItem>
                <MenuItem value="receiver">{props.t("receiver")}</MenuItem>
                <MenuItem value="description">
                  {props.t("description")}
                </MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label={props.t("search")}
              value={props.data.searchText}
              onChange={(e) => props.onSearchTextChange(e.target.value)}
              sx={{ width: 200 }}
            />
          </Stack>

          <AssetButton
            label={props.t("reset")}
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={props.onReset}
            sx={{ height: 40 }}
          />
        </Stack>

        {filterSummary.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
              {props.t("activeFilters")}:
            </Typography>
            {filterSummary.map((filter, index) => (
              <Chip
                key={index}
                label={filter}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

export default withTranslation(transactionContext.name)(TransactionFilter);
