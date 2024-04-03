import { withTranslation, WithTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts.ts";
import { Paper, Stack } from "@mui/material";
import AlisaPropertySelect from "../../alisa/data/AlisaPropertySelect.tsx";

interface TransactionsPendingFilterProps extends WithTranslation {
  marginTop?: number;
  open: boolean;
  onSelectProperty: (propertyId: number) => void;
  selectedPropertyId?: number;
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
          variant={"radio"}
          t={props.t}
          direction={"row"}
          onSelectProperty={props.onSelectProperty}
          defaultPropertyId={props.selectedPropertyId}
        ></AlisaPropertySelect>
      </Stack>
    </Paper>
  );
}

export default withTranslation(transactionContext.name)(
  TransactionsPendingFilter,
);
