import { withTranslation, WithTranslation } from "react-i18next";
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
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import ClearIcon from "@mui/icons-material/Clear";
import { useEffect, useState } from "react";
import { AlisaButton } from "../alisa";
import DataService from "@alisa-lib/data-service";
import { expenseTypeContext, incomeTypeContext } from "@alisa-lib/alisa-contexts";
import { ExpenseType, IncomeType } from "@alisa-types";

export type AccountingFilterMode = "expense" | "income";

export interface AccountingFilterData {
  typeIds: number[];
  searchText: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface AccountingFilterProps extends WithTranslation {
  mode: AccountingFilterMode;
  data: AccountingFilterData;
  onTypeChange: (typeIds: number[]) => void;
  onSearchTextChange: (searchText: string) => void;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onReset: () => void;
}

function AccountingFilter({
  t,
  mode,
  data,
  onTypeChange,
  onSearchTextChange,
  onStartDateChange,
  onEndDateChange,
  onReset,
}: AccountingFilterProps) {
  const [types, setTypes] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const fetchTypes = async () => {
      if (mode === "expense") {
        const service = new DataService<ExpenseType>({
          context: expenseTypeContext,
          fetchOptions: { order: { name: "ASC" } },
        });
        const fetchedData = await service.search();
        setTypes(fetchedData.map((t) => ({ id: t.id, name: t.name })));
      } else {
        const service = new DataService<IncomeType>({
          context: incomeTypeContext,
          fetchOptions: { order: { name: "ASC" } },
        });
        const fetchedData = await service.search();
        setTypes(fetchedData.map((t) => ({ id: t.id, name: t.name })));
      }
    };

    fetchTypes();
  }, [mode]);

  const handleTypeChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    onTypeChange(typeof value === "string" ? value.split(",").map(Number) : value);
  };

  const getTypeLabel = (selected: number[]) => {
    if (!selected || selected.length === 0) {
      return t("dataNotSelected");
    }
    return selected
      .map((id) => {
        const type = types.find((t) => t.id === id);
        return type ? type.name : "";
      })
      .join(", ");
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return dayjs(date).format("DD.MM.YYYY");
  };

  const getFilterSummary = (): string[] => {
    const filters: string[] = [];

    if (data.typeIds.length > 0) {
      const typeNames = data.typeIds
        .map((id) => {
          const type = types.find((t) => t.id === id);
          return type ? type.name : "";
        })
        .join(", ");
      filters.push(
        `${mode === "expense" ? t("expenseType") : t("incomeType")}: ${typeNames}`
      );
    }

    if (data.startDate || data.endDate) {
      const startStr = formatDate(data.startDate) || "";
      const endStr = formatDate(data.endDate) || "";
      if (startStr && endStr) {
        filters.push(`${startStr} - ${endStr}`);
      } else if (startStr) {
        filters.push(`${t("startDate")}: ${startStr}`);
      } else if (endStr) {
        filters.push(`${t("endDate")}: ${endStr}`);
      }
    }

    if (data.searchText) {
      filters.push(`${t("description")}: "${data.searchText}"`);
    }

    return filters;
  };

  const filterSummary = getFilterSummary();
  const typeLabel = mode === "expense" ? t("expenseType") : t("incomeType");

  return (
    <Paper sx={{ padding: 2, marginBottom: 2 }}>
      <Stack spacing={3}>
        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          useFlexGap
          alignItems="flex-end"
        >
          {types.length > 0 && (
            <FormControl size="small" sx={{ width: 250 }}>
              <InputLabel>{typeLabel}</InputLabel>
              <Select
                multiple
                value={data.typeIds}
                onChange={handleTypeChange}
                input={<OutlinedInput label={typeLabel} />}
                renderValue={getTypeLabel}
              >
                {types.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    <Checkbox checked={data.typeIds.includes(type.id)} />
                    <ListItemText primary={type.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Stack direction="row" spacing={0.5} alignItems="center">
            <DatePicker
              label={t("startDate")}
              value={data.startDate ? dayjs(data.startDate) : null}
              onChange={(value) => {
                onStartDateChange(value ? value.toDate() : null);
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
              label={t("endDate")}
              value={data.endDate ? dayjs(data.endDate) : null}
              onChange={(value) => {
                onEndDateChange(value ? value.toDate() : null);
              }}
              slotProps={{
                textField: { size: "small", sx: { width: 185 } },
                field: { clearable: true },
              }}
            />
          </Stack>

          <TextField
            size="small"
            label={t("search")}
            value={data.searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
            sx={{ width: 200 }}
          />

          <AlisaButton
            label={t("reset")}
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={onReset}
          />
        </Stack>

        {filterSummary.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ alignSelf: "center" }}
            >
              {t("activeFilters")}:
            </Typography>
            {filterSummary.map((filter, index) => (
              <Chip key={index} label={filter} size="small" variant="outlined" />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

export default withTranslation("accounting")(AccountingFilter);
