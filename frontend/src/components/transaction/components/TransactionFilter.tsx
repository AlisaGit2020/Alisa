import { withTranslation, WithTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts.ts";
import {
  Button,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import ClearIcon from "@mui/icons-material/Clear";
import {
  TransactionType,
  transactionTypeNames,
} from "@alisa-backend/common/types.ts";

export type SearchField = "sender" | "receiver" | "description";

export interface TransactionFilterData {
  propertyId: number;
  transactionTypes: TransactionType[];
  startDate: Date | null;
  endDate: Date | null;
  searchText: string;
  searchField: SearchField;
}

interface TransactionFilterProps extends WithTranslation {
  marginTop?: number;
  open: boolean;
  data: TransactionFilterData;
  onSelectTransactionTypes: (transactionTypes: TransactionType[]) => void;
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

  const handleTransactionTypeChange = (
    event: SelectChangeEvent<TransactionType[]>,
  ) => {
    const value = event.target.value;
    props.onSelectTransactionTypes(
      typeof value === "string"
        ? (value.split(",").map(Number) as TransactionType[])
        : value,
    );
  };

  const getTransactionTypeLabel = (selected: TransactionType[]) => {
    if (!selected || selected.length === 0) {
      return props.t("dataNotSelected");
    }
    return selected
      .map((type) => {
        const option = transactionTypeOptions.find((o) => o.id === type);
        return option ? option.name : "";
      })
      .join(", ");
  };

  const transactionTypes = props.data.transactionTypes || [];

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return dayjs(date).format("DD.MM.YYYY");
  };

  const getFilterSummary = (): string[] => {
    const filters: string[] = [];

    if (transactionTypes.length > 0) {
      const typeNames = transactionTypes
        .map((type) => {
          const option = transactionTypeOptions.find((o) => o.id === type);
          return option ? option.name : "";
        })
        .join(", ");
      filters.push(`${props.t("transactionType")}: ${typeNames}`);
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
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction={"row"} spacing={2} flexWrap="wrap" useFlexGap alignItems="flex-end">
          <FormControl size="small" sx={{ width: 180 }}>
            <InputLabel>{props.t("transactionType")}</InputLabel>
            <Select
              multiple
              value={transactionTypes}
              onChange={handleTransactionTypeChange}
              input={<OutlinedInput label={props.t("transactionType")} />}
              renderValue={getTransactionTypeLabel}
            >
              {transactionTypeOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  <Checkbox
                    checked={transactionTypes.includes(option.id)}
                  />
                  <ListItemText primary={option.name} />
                </MenuItem>
              ))}
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

          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={props.onReset}
            sx={{ height: 40 }}
          >
            {props.t("reset")}
          </Button>
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
