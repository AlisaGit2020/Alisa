import { withTranslation, WithTranslation } from "react-i18next";
import {
  expenseTypeContext,
  incomeTypeContext,
  transactionContext,
} from "@alisa-lib/alisa-contexts.ts";
import { TransactionType, ExpenseType, IncomeType } from "@alisa-types";
import { Box, Chip, Paper, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import SaveIcon from "@mui/icons-material/Save";
import { AlisaCloseIcon } from "../../alisa/AlisaIcons.tsx";
import Typography from "@mui/material/Typography";
import {
  AlisaButton,
  AlisaConfirmDialog,
  AlisaTransactionTypeSelect,
  AlisaSelect,
} from "../../alisa";
import React from "react";
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
  supportsLoanSplit?: boolean;
  bankName?: string;
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

const CATEGORY_DROPDOWN_WIDTH = 250;

function TransactionsPendingActions(props: TransactionsPendingActionsProps) {
  const [loanSplitState, setLoanSplitState] = React.useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
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

  const handleSave = async () => {
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
    // Reset state and deselect rows
    setTransactionType(0);
    setCategoryTypeData({ expenseTypeId: 0, incomeTypeId: 0 });
    props.onCancel();
  };

  const handleTypeChange = (type: number) => {
    setTransactionType(type);
    // Reset category when type changes
    setCategoryTypeData({ expenseTypeId: 0, incomeTypeId: 0 });
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

  const handleCancel = () => {
    if (loanSplitState) {
      handleCancelLoanSplit();
    } else {
      // Reset allocation state and close
      setTransactionType(0);
      setCategoryTypeData({ expenseTypeId: 0, incomeTypeId: 0 });
      props.onCancel();
    }
  };

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    props.onDelete();
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
  };

  const isSaveDisabled = transactionType <= 0;
  const supportsLoanSplit = props.supportsLoanSplit ?? true;

  return (
    <Paper
      sx={{
        display: props.open ? "block" : "none",
        marginTop: props.marginTop,
        padding: 2,
      }}
    >
      <Stack direction={"column"} spacing={2}>
        {/* Row count - prominent chip */}
        <Box>
          <Chip
            label={props.t("rowsSelected", { count: props.selectedIds.length })}
            color="primary"
            size="medium"
          />
        </Box>

        {/* Section 1: Allocation */}
        <Box
          sx={{
            display: !loanSplitState ? "block" : "none",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            p: 1.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: "bold" }}>
            {props.t("allocation")}
          </Typography>

          {/* Type buttons - exclude Unknown (0) */}
          <AlisaTransactionTypeSelect
            onSelect={handleTypeChange}
            selectedValue={transactionType}
            t={props.t}
            variant={"button"}
            direction={"row"}
            showLabel={false}
            visible={true}
            showEmptyValue={false}
            excludeTypes={[TransactionType.UNKNOWN]}
          />

          {/* Category dropdown - conditional based on selected type */}
          {(transactionType === TransactionType.EXPENSE ||
            transactionType === TransactionType.INCOME) && (
            <Stack direction="row" spacing={2} alignItems="flex-end" sx={{ mt: 2 }}>
              {transactionType === TransactionType.EXPENSE && (
                <Box sx={{ width: CATEGORY_DROPDOWN_WIDTH }}>
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
                    fullWidth
                  />
                </Box>
              )}

              {transactionType === TransactionType.INCOME && (
                <Box sx={{ width: CATEGORY_DROPDOWN_WIDTH }}>
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
                    fullWidth
                  />
                </Box>
              )}
            </Stack>
          )}

          {/* Save button - always visible, disabled when no type selected */}
          <Box sx={{ mt: 2 }}>
            <AlisaButton
              label={props.t("save")}
              variant="text"
              color="primary"
              onClick={handleSave}
              disabled={isSaveDisabled}
              tooltip={isSaveDisabled ? props.t("saveAllocationTooltip") : undefined}
              endIcon={<SaveIcon />}
            />
          </Box>
        </Box>

        {/* Section 2: Automatic Allocation (Loan Splitting) */}
        {!props.hideSplitLoanPayment && (
          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              p: 1.5,
              opacity: supportsLoanSplit ? 1 : 0.6,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: "bold" }}>
              {props.t("automaticAllocation")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {supportsLoanSplit
                ? props.t("automaticAllocationDescription")
                : props.t("automaticAllocationNotSupported", { bank: props.bankName || "This" })}
            </Typography>

            {supportsLoanSplit && (
              <>
                {!loanSplitState ? (
                  <AlisaButton
                    label={props.t("splitLoanPayment")}
                    variant="text"
                    onClick={handleLoanSplit}
                    endIcon={<CallSplitIcon />}
                  />
                ) : (
                  <>
                    <Stack direction="row" spacing={2} alignItems="flex-end">
                      <Box sx={{ width: CATEGORY_DROPDOWN_WIDTH }}>
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
                          fullWidth
                        />
                      </Box>
                      <Box sx={{ width: CATEGORY_DROPDOWN_WIDTH }}>
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
                          fullWidth
                        />
                      </Box>
                      <Box sx={{ width: CATEGORY_DROPDOWN_WIDTH }}>
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
                          fullWidth
                        />
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <AlisaButton
                        label={props.t("save")}
                        variant="text"
                        color="primary"
                        onClick={handleLoanSplit}
                        disabled={
                          loanSplitData.principalExpenseTypeId === 0 ||
                          loanSplitData.interestExpenseTypeId === 0
                        }
                        endIcon={<SaveIcon />}
                      />
                      <AlisaButton
                        label={props.t("cancel")}
                        variant="text"
                        onClick={handleCancelLoanSplit}
                        endIcon={<AlisaCloseIcon />}
                      />
                    </Stack>
                  </>
                )}
              </>
            )}
          </Box>
        )}

        {/* Section 3: Other Actions */}
        <Box
          sx={{
            display: !loanSplitState ? "block" : "none",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            p: 1.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: "bold" }}>
            {props.t("otherActions")}
          </Typography>
          <Stack direction="row" spacing={2}>
            <AlisaButton
              label={props.t("delete")}
              variant="text"
              color="error"
              onClick={handleDeleteClick}
              endIcon={<DeleteIcon />}
            />
            <AlisaButton
              label={props.t("cancel")}
              variant="text"
              onClick={handleCancel}
              endIcon={<AlisaCloseIcon />}
            />
          </Stack>
        </Box>
      </Stack>

      <AlisaConfirmDialog
        title={props.t("confirm")}
        contentText={props.t("confirmDeleteTransactions", {
          count: props.selectedIds.length,
        })}
        buttonTextConfirm={props.t("delete")}
        buttonTextCancel={props.t("cancel")}
        open={confirmOpen}
        onConfirm={handleConfirmDelete}
        onClose={handleConfirmClose}
      />
    </Paper>
  );
}

export default withTranslation(transactionContext.name)(
  TransactionsPendingActions,
);
