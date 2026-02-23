import { Grid, IconButton } from "@mui/material";
import AssetTextField from "../../asset/form/AssetTextField.tsx";
import AssetNumberField from "../../asset/form/AssetNumberField.tsx";
import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";
import { TFunction } from "i18next";
import { TransactionRow } from "@asset-lib/types.ts";

interface RowDataFieldsProps<T> {
  t: TFunction;
  typeSelect: React.ReactNode;
  data: T;
  index: number;
  onHandleChange: (index: number, name: keyof T, value: T[keyof T]) => void;
  onCalculateAmount: (index: number) => void;
  onRemoveRow: (index: number) => void;
}

function RowDataFields<T extends TransactionRow>(props: RowDataFieldsProps<T>) {
  return (
    <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
      <Grid size={2.5}>{props.typeSelect}</Grid>
      <Grid size={3}>
        <AssetTextField
          label={props.t("description")}
          value={props.data.description}
          autoComplete="off"
          onChange={(e) =>
            props.onHandleChange(
              props.index,
              "description",
              e.target.value as T[keyof T],
            )
          }
        />
      </Grid>
      <Grid size={2}>
        <AssetNumberField
          disabled={true}
          label={props.t("amount")}
          value={props.data.amount}
          onChange={(e) =>
            props.onHandleChange(
              props.index,
              "amount",
              e.target.value as T[keyof T],
            )
          }
          adornment="€"
        />
      </Grid>
      <Grid size={1.5}>
        <AssetNumberField
          label={props.t("quantity")}
          value={props.data.quantity}
          onChange={(e) =>
            props.onHandleChange(
              props.index,
              "quantity",
              e.target.value as T[keyof T],
            )
          }
          onBlur={() => props.onCalculateAmount(props.index)}
        />
      </Grid>
      <Grid size={2}>
        <AssetNumberField
          label={props.t("totalAmount")}
          value={props.data.totalAmount}
          autoComplete="off"
          onChange={(e) =>
            props.onHandleChange(
              props.index,
              "totalAmount",
              e.target.value as T[keyof T],
            )
          }
          onBlur={() => props.onCalculateAmount(props.index)}
          adornment="€"
        />
      </Grid>
      <Grid size={1} sx={{ display: "flex", justifyContent: "center" }}>
        <IconButton
          onClick={() => props.onRemoveRow(props.index)}
          title={props.t("delete")}
        >
          <DeleteIcon color={"secondary"}></DeleteIcon>
        </IconButton>
      </Grid>
    </Grid>
  );
}

export default RowDataFields;
