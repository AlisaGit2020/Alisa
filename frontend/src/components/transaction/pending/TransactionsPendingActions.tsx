import { withTranslation, WithTranslation } from "react-i18next";
import {
  expenseTypeContext,
  incomeTypeContext,
  transactionContext,
} from "@alisa-lib/alisa-contexts.ts";
import { TransactionType, ExpenseType, IncomeType } from "@alisa-types";
import { Box, Chip, Paper, Stack } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
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

interface TransactionsPendingActionsProps extends WithTranslation {
  marginTop?: number;
  open: boolean;
  selectedIds: number[];
  hasExpenseTransactions: boolean;
  hasIncomeTransactions: boolean;
  hasUnallocatedSelected?: boolean;
  hideApprove?: boolean;
  hideSplitLoanPayment?: boolean;
  supportsLoanSplit?: boolean;
  bankName?: string;
  onCancel: () => void;
  onApprove: () => void;
  onSetType: (type: number) => Promise<void>;
  onSetCategoryType: (expenseTypeId?: number, incomeTypeId?: number) => Promise<void>;
  onSplitLoanPayment: () => Promise<void>;
  onDelete: () => void;
}

interface CategoryTypeData {
  expenseTypeId: number;
  incomeTypeId: number;
}

const CATEGORY_DROPDOWN_WIDTH = 250;

function TransactionsPendingActions(props: TransactionsPendingActionsProps) {
  const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
  const [transactionType, setTransactionType] = React.useState<number>(0);
  const [categoryTypeData, setCategoryTypeData] =
    React.useState<CategoryTypeData>({
      expenseTypeId: 0,
      incomeTypeId: 0,
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
    await props.onSplitLoanPayment();
  };

  const handleCancel = () => {
    // Reset allocation state and close
    setTransactionType(0);
    setCategoryTypeData({ expenseTypeId: 0, incomeTypeId: 0 });
    props.onCancel();
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

  // Save is disabled if:
  // - No type selected
  // - EXPENSE selected but no expense category
  // - INCOME selected but no income category
  const isSaveDisabled =
    transactionType <= 0 ||
    (transactionType === TransactionType.EXPENSE && categoryTypeData.expenseTypeId <= 0) ||
    (transactionType === TransactionType.INCOME && categoryTypeData.incomeTypeId <= 0);

  // Determine appropriate tooltip based on why save is disabled
  const getSaveTooltip = (): string | undefined => {
    if (!isSaveDisabled) return undefined;
    if (transactionType <= 0) {
      return props.t("saveAllocationTooltip");
    }
    if (
      (transactionType === TransactionType.EXPENSE && categoryTypeData.expenseTypeId <= 0) ||
      (transactionType === TransactionType.INCOME && categoryTypeData.incomeTypeId <= 0)
    ) {
      return props.t("saveAllocationCategoryTooltip");
    }
    return undefined;
  };

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
            display: "block",
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
                    t={props.t}
                    translateKeyPrefix="expenseTypes"
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
                    t={props.t}
                    translateKeyPrefix="incomeTypes"
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
              tooltip={getSaveTooltip()}
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
              <AlisaButton
                label={props.t("splitLoanPayment")}
                variant="text"
                onClick={handleLoanSplit}
                endIcon={<CallSplitIcon />}
              />
            )}
          </Box>
        )}

        {/* Section 3: Other Actions */}
        <Box
          sx={{
            display: "block",
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
            {!props.hideApprove && (
              <AlisaButton
                label={props.t("accept")}
                variant="text"
                color="success"
                onClick={props.onApprove}
                disabled={props.hasUnallocatedSelected}
                tooltip={
                  props.hasUnallocatedSelected
                    ? props.t("acceptDisabledTooltip")
                    : undefined
                }
                endIcon={<CheckIcon />}
              />
            )}
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
