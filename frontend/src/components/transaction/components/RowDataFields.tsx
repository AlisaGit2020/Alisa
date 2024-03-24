import { Grid, IconButton, Stack } from "@mui/material";
import AlisaTextField from "../../alisa/form/AlisaTextField.tsx";
import AlisaNumberField from "../../alisa/form/AlisaNumberField.tsx";
import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";
import { TFunction } from "i18next";
import { TransactionRow } from "@alisa-lib/types.ts";

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
    <Grid container spacing={0} rowSpacing={0} key={Math.random()}>
      <Grid container spacing={1} height={80}>
        <Grid item xs={2}>
          {props.typeSelect}
        </Grid>
        <Grid item xs={4}>
          <AlisaTextField
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
        <Grid item xs={6}>
          <Stack direction={"row"} spacing={1}>
            <AlisaNumberField
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
            <AlisaNumberField
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
            <AlisaNumberField
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
            <IconButton
              onClick={() => props.onRemoveRow(props.index)}
              title={props.t("delete")}
            >
              <DeleteIcon color={"secondary"}></DeleteIcon>
            </IconButton>
          </Stack>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default RowDataFields;
