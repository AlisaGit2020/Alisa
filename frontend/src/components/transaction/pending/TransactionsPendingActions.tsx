import { withTranslation, WithTranslation } from "react-i18next";
import {
  expenseTypeContext,
  incomeTypeContext,
  transactionContext,
} from "@alisa-lib/alisa-contexts.ts";
import { TransactionType } from "@alisa-backend/common/types.ts";
import { Box, Button, Paper, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  AlisaApproveIcon,
  AlisaCloseIcon,
  AlisaEditIcon,
} from "../../alisa/AlisaIcons.tsx";
import Typography from "@mui/material/Typography";
import { DataSaveResultDto } from "@alisa-backend/common/dtos/data-save-result.dto.ts";
import AlisaDataSaveResult from "../../alisa/AlisaDataSaveResult.tsx";
import AlisaTransactionTypeSelect from "../../alisa/data/AlisaTransactionTypeSelect.tsx";
import React from "react";
import AlisaSelect from "../../alisa/data/AlisaSelect.tsx";
import DataService from "@alisa-lib/data-service.ts";
import { ExpenseType } from "@alisa-backend/accounting/expense/entities/expense-type.entity.ts";
import { IncomeType } from "@alisa-backend/accounting/income/entities/income-type.entity.ts";

interface TransactionsPendingActionsProps extends WithTranslation {
  marginTop?: number;
  open: boolean;
  selectedIds: number[];
  hasExpenseTransactions: boolean;
  hasIncomeTransactions: boolean;
  onCancel: () => void;
  onApprove: () => void;
  onSetType: (type: number) => Promise<void>;
  onSetCategoryType: (expenseTypeId?: number, incomeTypeId?: number) => Promise<void>;
  onDelete: () => void;
  saveResult?: DataSaveResultDto;
}

interface CategoryTypeData {
  expenseTypeId: number;
  incomeTypeId: number;
}

function TransactionsPendingActions(props: TransactionsPendingActionsProps) {
  const [editState, setEditState] = React.useState<boolean>(false);
  const [transactionType, setTransactionType] = React.useState<number>(0);
  const [categoryTypeData, setCategoryTypeData] =
    React.useState<CategoryTypeData>({
      expenseTypeId: 0,
      incomeTypeId: 0,
    });

  const handleEdit = async () => {
    if (editState) {
      if (transactionType > 0) {
        await props.onSetType(transactionType);
      }
      if (categoryTypeData.expenseTypeId > 0 || categoryTypeData.incomeTypeId > 0) {
        await props.onSetCategoryType(
          categoryTypeData.expenseTypeId > 0
            ? categoryTypeData.expenseTypeId
            : undefined,
          categoryTypeData.incomeTypeId > 0
            ? categoryTypeData.incomeTypeId
            : undefined,
        );
      }
      setEditState(false);
      setCategoryTypeData({ expenseTypeId: 0, incomeTypeId: 0 });
      setTransactionType(0);
    } else {
      setEditState(true);
    }
  };

  const handleCancel = () => {
    if (editState) {
      setEditState(false);
      setCategoryTypeData({ expenseTypeId: 0, incomeTypeId: 0 });
    } else {
      props.onCancel();
    }
  };

  const handleTypeChange = (type: number) => {
    setTransactionType(type);
  };

  const handleCategoryTypeChange = (
    fieldName: keyof CategoryTypeData,
    value: number,
  ) => {
    setCategoryTypeData({ ...categoryTypeData, [fieldName]: value });
  };

  return (
    <Paper
      sx={{
        display: props.open ? "block" : "none",
        marginTop: props.marginTop,
        padding: 2,
      }}
    >
      <Stack direction={"column"} spacing={1}>
        <Box>
          <Typography variant={"body2"}>
            {" "}
            {props.t("rowsSelected", { count: props.selectedIds.length })}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={2}
          sx={{ display: !editState ? "flex" : "none" }}
        >
          <Button
            variant={"text"}
            color={"success"}
            onClick={props.onApprove}
            endIcon={<AlisaApproveIcon></AlisaApproveIcon>}
          >
            {props.t("approve")}
          </Button>
          <Button
            variant="text"
            onClick={handleEdit}
            endIcon={<AlisaEditIcon></AlisaEditIcon>}
          >
            {props.t("edit")}
          </Button>
          <Button
            variant="text"
            color={"error"}
            onClick={props.onDelete}
            endIcon={<DeleteIcon></DeleteIcon>}
          >
            {props.t("delete")}
          </Button>
          <Button
            variant="text"
            onClick={() => handleCancel()}
            endIcon={<AlisaCloseIcon></AlisaCloseIcon>}
          >
            {props.t("cancel")}
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          sx={{ display: editState ? "flex" : "none" }}
        >
          <Button
            variant="text"
            color={"success"}
            onClick={handleEdit}
            endIcon={<AlisaApproveIcon></AlisaApproveIcon>}
          >
            {props.t("save")}
          </Button>

          <Button
            variant="text"
            onClick={() => handleCancel()}
            endIcon={<AlisaCloseIcon></AlisaCloseIcon>}
          >
            {props.t("cancel")}
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-end"
          sx={{ display: editState ? "flex" : "none" }}
        >
          <AlisaTransactionTypeSelect
            onSelect={handleTypeChange}
            selectedValue={transactionType}
            t={props.t}
            variant={"split-button"}
            direction={"row"}
            showLabel={true}
            visible={true}
          ></AlisaTransactionTypeSelect>

          {(transactionType === TransactionType.EXPENSE ||
            (transactionType === 0 && props.hasExpenseTransactions)) && (
            <Box sx={{ minWidth: 200 }}>
              <AlisaSelect<CategoryTypeData, ExpenseType>
                label={props.t("expenseType")}
                dataService={
                  new DataService<ExpenseType>({
                    context: expenseTypeContext,
                    fetchOptions: { order: { name: "ASC" } },
                  })
                }
                fieldName="expenseTypeId"
                value={categoryTypeData.expenseTypeId}
                onHandleChange={handleCategoryTypeChange}
                size="small"
              ></AlisaSelect>
            </Box>
          )}

          {(transactionType === TransactionType.INCOME ||
            (transactionType === 0 && props.hasIncomeTransactions)) && (
            <Box sx={{ minWidth: 200 }}>
              <AlisaSelect<CategoryTypeData, IncomeType>
                label={props.t("incomeType")}
                dataService={
                  new DataService<IncomeType>({
                    context: incomeTypeContext,
                    fetchOptions: { order: { name: "ASC" } },
                  })
                }
                fieldName="incomeTypeId"
                value={categoryTypeData.incomeTypeId}
                onHandleChange={handleCategoryTypeChange}
                size="small"
              ></AlisaSelect>
            </Box>
          )}
        </Stack>
      </Stack>
      <AlisaDataSaveResult
        result={props.saveResult as DataSaveResultDto}
        visible={props.saveResult !== undefined && !editState}
        t={props.t}
      ></AlisaDataSaveResult>
    </Paper>
  );
}

export default withTranslation(transactionContext.name)(
  TransactionsPendingActions,
);
