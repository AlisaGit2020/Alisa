import { withTranslation, WithTranslation } from "react-i18next";
import {
  expenseTypeContext,
  incomeTypeContext,
  transactionContext,
} from "@alisa-lib/alisa-contexts.ts";
import { TransactionType, DataSaveResult, ExpenseType, IncomeType } from "@alisa-types";
import { Box, Button, Paper, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import {
  AlisaApproveIcon,
  AlisaCloseIcon,
  AlisaEditIcon,
} from "../../alisa/AlisaIcons.tsx";
import Typography from "@mui/material/Typography";
import AlisaDataSaveResult from "../../alisa/AlisaDataSaveResult.tsx";
import AlisaTransactionTypeSelect from "../../alisa/data/AlisaTransactionTypeSelect.tsx";
import React from "react";
import AlisaSelect from "../../alisa/data/AlisaSelect.tsx";
import DataService from "@alisa-lib/data-service.ts";
import ApiClient from "@alisa-lib/api-client.ts";

interface TransactionsPendingActionsProps extends WithTranslation {
  marginTop?: number;
  open: boolean;
  selectedIds: number[];
  hasExpenseTransactions: boolean;
  hasIncomeTransactions: boolean;
  hideApprove?: boolean;
  hideSplitLoanPayment?: boolean;
  onCancel: () => void;
  onApprove: () => void;
  onSetType: (type: number) => Promise<void>;
  onSetCategoryType: (expenseTypeId?: number, incomeTypeId?: number) => Promise<void>;
  onSplitLoanPayment: (
    principalExpenseTypeId: number,
    interestExpenseTypeId: number,
    handlingFeeExpenseTypeId?: number,
  ) => Promise<void>;
  onDelete: () => void;
  saveResult?: DataSaveResult;
}

interface CategoryTypeData {
  expenseTypeId: number;
  incomeTypeId: number;
}

interface LoanSplitData {
  principalExpenseTypeId: number;
  interestExpenseTypeId: number;
  handlingFeeExpenseTypeId: number;
}

function TransactionsPendingActions(props: TransactionsPendingActionsProps) {
  const [editState, setEditState] = React.useState<boolean>(false);
  const [loanSplitState, setLoanSplitState] = React.useState<boolean>(false);
  const [transactionType, setTransactionType] = React.useState<number>(0);
  const [categoryTypeData, setCategoryTypeData] =
    React.useState<CategoryTypeData>({
      expenseTypeId: 0,
      incomeTypeId: 0,
    });
  const [loanSplitData, setLoanSplitData] = React.useState<LoanSplitData>({
    principalExpenseTypeId: 0,
    interestExpenseTypeId: 0,
    handlingFeeExpenseTypeId: 0,
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
    } else if (loanSplitState) {
      handleCancelLoanSplit();
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

  const handleLoanSplit = async () => {
    if (loanSplitState) {
      if (
        loanSplitData.principalExpenseTypeId > 0 &&
        loanSplitData.interestExpenseTypeId > 0
      ) {
        await props.onSplitLoanPayment(
          loanSplitData.principalExpenseTypeId,
          loanSplitData.interestExpenseTypeId,
          loanSplitData.handlingFeeExpenseTypeId > 0
            ? loanSplitData.handlingFeeExpenseTypeId
            : undefined,
        );
      }
      setLoanSplitState(false);
      setLoanSplitData({
        principalExpenseTypeId: 0,
        interestExpenseTypeId: 0,
        handlingFeeExpenseTypeId: 0,
      });
    } else {
      // Load user's default loan expense types from settings
      const user = await ApiClient.me();
      setLoanSplitData({
        principalExpenseTypeId: user.loanPrincipalExpenseTypeId || 0,
        interestExpenseTypeId: user.loanInterestExpenseTypeId || 0,
        handlingFeeExpenseTypeId: user.loanHandlingFeeExpenseTypeId || 0,
      });
      setLoanSplitState(true);
    }
  };

  const handleLoanSplitDataChange = (
    fieldName: keyof LoanSplitData,
    value: number,
  ) => {
    setLoanSplitData({ ...loanSplitData, [fieldName]: value });
  };

  const handleCancelLoanSplit = () => {
    setLoanSplitState(false);
    setLoanSplitData({
      principalExpenseTypeId: 0,
      interestExpenseTypeId: 0,
      handlingFeeExpenseTypeId: 0,
    });
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
          sx={{ display: !editState && !loanSplitState ? "flex" : "none" }}
        >
          {!props.hideApprove && (
            <Button
              variant={"text"}
              color={"success"}
              onClick={props.onApprove}
              endIcon={<AlisaApproveIcon></AlisaApproveIcon>}
            >
              {props.t("approve")}
            </Button>
          )}
          <Button
            variant="text"
            onClick={handleEdit}
            endIcon={<AlisaEditIcon></AlisaEditIcon>}
          >
            {props.t("edit")}
          </Button>
          {!props.hideSplitLoanPayment && (
            <Button
              variant="text"
              onClick={handleLoanSplit}
              endIcon={<CallSplitIcon></CallSplitIcon>}
            >
              {props.t("splitLoanPayment")}
            </Button>
          )}
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

        {/* Loan Split Mode UI */}
        <Stack
          direction="row"
          spacing={2}
          sx={{ display: loanSplitState ? "flex" : "none" }}
        >
          <Button
            variant="text"
            color={"success"}
            onClick={handleLoanSplit}
            disabled={
              loanSplitData.principalExpenseTypeId === 0 ||
              loanSplitData.interestExpenseTypeId === 0
            }
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
          sx={{ display: loanSplitState ? "flex" : "none" }}
        >
          <Box sx={{ minWidth: 200 }}>
            <AlisaSelect<LoanSplitData, ExpenseType>
              label={props.t("loanPrincipal")}
              dataService={
                new DataService<ExpenseType>({
                  context: expenseTypeContext,
                  fetchOptions: { order: { name: "ASC" } },
                })
              }
              fieldName="principalExpenseTypeId"
              value={loanSplitData.principalExpenseTypeId}
              onHandleChange={handleLoanSplitDataChange}
              size="small"
            ></AlisaSelect>
          </Box>
          <Box sx={{ minWidth: 200 }}>
            <AlisaSelect<LoanSplitData, ExpenseType>
              label={props.t("loanInterest")}
              dataService={
                new DataService<ExpenseType>({
                  context: expenseTypeContext,
                  fetchOptions: { order: { name: "ASC" } },
                })
              }
              fieldName="interestExpenseTypeId"
              value={loanSplitData.interestExpenseTypeId}
              onHandleChange={handleLoanSplitDataChange}
              size="small"
            ></AlisaSelect>
          </Box>
          <Box sx={{ minWidth: 200 }}>
            <AlisaSelect<LoanSplitData, ExpenseType>
              label={props.t("loanHandlingFee")}
              dataService={
                new DataService<ExpenseType>({
                  context: expenseTypeContext,
                  fetchOptions: { order: { name: "ASC" } },
                })
              }
              fieldName="handlingFeeExpenseTypeId"
              value={loanSplitData.handlingFeeExpenseTypeId}
              onHandleChange={handleLoanSplitDataChange}
              size="small"
            ></AlisaSelect>
          </Box>
        </Stack>
      </Stack>
      <AlisaDataSaveResult
        result={props.saveResult as DataSaveResult}
        visible={props.saveResult !== undefined && !editState && !loanSplitState}
        t={props.t}
      ></AlisaDataSaveResult>
    </Paper>
  );
}

export default withTranslation(transactionContext.name)(
  TransactionsPendingActions,
);
