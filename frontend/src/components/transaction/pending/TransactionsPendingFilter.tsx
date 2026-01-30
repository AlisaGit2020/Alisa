import { withTranslation, WithTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts.ts";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AlisaPropertySelect from "../../alisa/data/AlisaPropertySelect.tsx";
import AlisaTransactionTypeSelect from "../../alisa/data/AlisaTransactionTypeSelect.tsx";

export type SearchField = "sender" | "receiver" | "description";

interface TransactionsPendingFilterProps extends WithTranslation {
  marginTop?: number;
  open: boolean;
  data: {
    propertyId: number;
    transactionTypeId: number;
    searchText: string;
    searchField: SearchField;
  };
  onSelectProperty: (propertyId: number) => void;
  onSelectTransactionType: (transactionTypeId: number) => void;
  onSearchTextChange: (searchText: string) => void;
  onSearchFieldChange: (searchField: SearchField) => void;
}

function TransactionsPendingFilter(props: TransactionsPendingFilterProps) {
  return (
    <Paper
      sx={{
        display: props.open ? "block" : "none",
        marginTop: props.marginTop,
        padding: 2,
      }}
    >
      <Stack direction={"row"} spacing={2}>
        <AlisaPropertySelect
          variant={"split-button"}
          t={props.t}
          direction={"column"}
          onSelectProperty={props.onSelectProperty}
          selectedPropertyId={props.data.propertyId}
          showEmptyValue={true}
        ></AlisaPropertySelect>
        <AlisaTransactionTypeSelect
          variant={"split-button"}
          t={props.t}
          direction={"column"}
          onSelect={props.onSelectTransactionType}
          selectedValue={props.data.transactionTypeId}
          showLabel={true}
          showEmptyValue={true}
        ></AlisaTransactionTypeSelect>
        <Stack spacing={1}>
          <Box>
            <Typography variant={"body2"}>{props.t("search")}</Typography>
          </Box>
          <Stack direction={"row"} spacing={1}>
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
              placeholder={props.t("search")}
              value={props.data.searchText}
              onChange={(e) => props.onSearchTextChange(e.target.value)}
              sx={{ minWidth: 200 }}
            />
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default withTranslation(transactionContext.name)(
  TransactionsPendingFilter,
);
