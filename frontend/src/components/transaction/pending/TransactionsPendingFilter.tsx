import { withTranslation, WithTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts.ts";
import { Paper, Stack } from "@mui/material";
import AlisaPropertySelect from "../../alisa/data/AlisaPropertySelect.tsx";
import AlisaTransactionTypeSelect from "../../alisa/data/AlisaTransactionTypeSelect.tsx";

interface TransactionsPendingFilterProps extends WithTranslation {
  marginTop?: number;
  open: boolean;
  data: {
    propertyId: number;
    transactionTypeId: number;
  };
  onSelectProperty: (propertyId: number) => void;
  onSelectTransactionType: (transactionTypeId: number) => void;
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
      </Stack>
    </Paper>
  );
}

export default withTranslation(transactionContext.name)(
  TransactionsPendingFilter,
);
