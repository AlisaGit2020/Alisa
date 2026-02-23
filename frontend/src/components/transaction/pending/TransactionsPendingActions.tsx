import { withTranslation, WithTranslation } from "react-i18next";
import {
  expenseTypeContext,
  incomeTypeContext,
  transactionContext,
} from "@asset-lib/asset-contexts.ts";
import { TransactionType, ExpenseType, IncomeType } from "@asset-types";
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Tooltip,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import SaveIcon from "@mui/icons-material/Save";
import RuleIcon from "@mui/icons-material/Rule";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { AssetCloseIcon } from "../../asset/AssetIcons.tsx";
import Typography from "@mui/material/Typography";
import {
  AssetButton,
  AssetConfirmDialog,
  AssetTransactionTypeSelect,
  AssetSelect,
} from "../../asset";
import React from "react";
import DataService from "@asset-lib/data-service.ts";

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
  onOpenAllocationRules?: () => void;
  onAutoAllocate?: () => void;
  autoAllocateDisabled?: boolean;
  isAllocating?: boolean;
  onResetAllocation?: () => void;
  hasAllocatedSelected?: boolean;
  /** Compact floating action bar mode */
  compact?: boolean;
}

interface CategoryTypeData {
  expenseTypeId: number;
  incomeTypeId: number;
}

const CATEGORY_DROPDOWN_WIDTH = 250;

function TransactionsPendingActions(props: TransactionsPendingActionsProps) {
  const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
  const [transactionType, setTransactionType] = React.useState<number>(0);
  const [expanded, setExpanded] = React.useState<boolean>(false);
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

  // Compact floating action bar mode
  if (props.compact) {
    return (
      <>
        <Paper
          sx={{
            display: props.open ? "block" : "none",
            marginTop: props.marginTop,
            padding: 1,
            position: "sticky",
            top: 0,
            zIndex: 10,
            borderRadius: 2,
          }}
          elevation={3}
        >
          {/* Main compact bar */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            {/* Selection count */}
            <Chip
              label={props.selectedIds.length}
              color="primary"
              size="small"
            />

            {/* Type buttons - inline */}
            <AssetTransactionTypeSelect
              onSelect={handleTypeChange}
              selectedValue={transactionType}
              t={props.t}
              variant="button"
              direction="row"
              showLabel={false}
              visible={true}
              showEmptyValue={false}
              excludeTypes={[TransactionType.UNKNOWN]}
            />

            {/* Category dropdown - shows when type selected */}
            {transactionType === TransactionType.EXPENSE && (
              <Box sx={{ minWidth: 180 }}>
                <AssetSelect<CategoryTypeData, ExpenseType>
                  label={props.t("expenseType")}
                  dataService={
                    new DataService<ExpenseType>({
                      context: expenseTypeContext,
                      fetchOptions: { order: { key: "ASC" } },
                    })
                  }
                  fieldName="expenseTypeId"
                  value={categoryTypeData.expenseTypeId}
                  onHandleChange={handleCategoryTypeChange}
                  size="small"
                  fullWidth
                  t={props.t}
                  translateKeyPrefix="expense-type"
                />
              </Box>
            )}

            {transactionType === TransactionType.INCOME && (
              <Box sx={{ minWidth: 180 }}>
                <AssetSelect<CategoryTypeData, IncomeType>
                  label={props.t("incomeType")}
                  dataService={
                    new DataService<IncomeType>({
                      context: incomeTypeContext,
                      fetchOptions: { order: { key: "ASC" } },
                    })
                  }
                  fieldName="incomeTypeId"
                  value={categoryTypeData.incomeTypeId}
                  onHandleChange={handleCategoryTypeChange}
                  size="small"
                  fullWidth
                  t={props.t}
                  translateKeyPrefix="income-type"
                />
              </Box>
            )}

            {/* Save button */}
            <Tooltip title={getSaveTooltip() || props.t("save")}>
              <span>
                <IconButton
                  color="primary"
                  onClick={handleSave}
                  disabled={isSaveDisabled}
                  size="small"
                >
                  <SaveIcon />
                </IconButton>
              </span>
            </Tooltip>

            {/* Divider */}
            <Box sx={{ borderLeft: 1, borderColor: "divider", height: 24, mx: 0.5 }} />

            {/* Auto-allocate */}
            {props.onAutoAllocate && (
              <Tooltip title={props.t("allocation:autoAllocate")}>
                <span>
                  <IconButton
                    color="primary"
                    onClick={props.onAutoAllocate}
                    disabled={props.autoAllocateDisabled || props.isAllocating}
                    size="small"
                  >
                    <AutoFixHighIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* Rules */}
            {props.onOpenAllocationRules && (
              <Tooltip title={props.t("allocation:rules")}>
                <IconButton
                  onClick={props.onOpenAllocationRules}
                  size="small"
                >
                  <RuleIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Divider */}
            <Box sx={{ borderLeft: 1, borderColor: "divider", height: 24, mx: 0.5 }} />

            {/* Delete */}
            <Tooltip title={props.t("delete")}>
              <IconButton
                color="error"
                onClick={handleDeleteClick}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>

            {/* Cancel/Close */}
            <Tooltip title={props.t("cancel")}>
              <IconButton onClick={handleCancel} size="small">
                <AssetCloseIcon />
              </IconButton>
            </Tooltip>

            {/* Expand toggle for more options */}
            <Tooltip title={expanded ? props.t("common:showLess") : props.t("common:showMore")}>
              <IconButton onClick={() => setExpanded(!expanded)} size="small">
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Expanded section for less common actions */}
          <Collapse in={expanded}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: "divider" }}
              flexWrap="wrap"
              useFlexGap
            >
              {/* Split loan payment */}
              {!props.hideSplitLoanPayment && supportsLoanSplit && (
                <AssetButton
                  label={props.t("splitLoanPayment")}
                  variant="text"
                  size="small"
                  onClick={handleLoanSplit}
                  endIcon={<CallSplitIcon />}
                />
              )}

              {/* Reset allocation */}
              {props.onResetAllocation && (
                <AssetButton
                  label={props.t("resetAllocation")}
                  variant="text"
                  size="small"
                  color="warning"
                  onClick={props.onResetAllocation}
                  disabled={!props.hasAllocatedSelected}
                  tooltip={
                    !props.hasAllocatedSelected
                      ? props.t("resetAllocationDisabledTooltip")
                      : undefined
                  }
                  endIcon={<RestartAltIcon />}
                />
              )}

              {/* Accept (if shown) */}
              {!props.hideApprove && (
                <AssetButton
                  label={props.t("accept")}
                  variant="text"
                  size="small"
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

              {!props.hideSplitLoanPayment && !supportsLoanSplit && (
                <Typography variant="body2" color="text.secondary">
                  {props.t("automaticAllocationNotSupported", { bank: props.bankName || "This" })}
                </Typography>
              )}
            </Stack>
          </Collapse>
        </Paper>

        <AssetConfirmDialog
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
      </>
    );
  }

  // Original full-size layout
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
            label={
              props.hasAllocatedSelected && !props.hasUnallocatedSelected
                ? props.t("allocatedRowsSelected", { count: props.selectedIds.length })
                : !props.hasAllocatedSelected && props.hasUnallocatedSelected
                  ? props.t("notAllocatedRowsSelected", { count: props.selectedIds.length })
                  : props.t("rowsSelected", { count: props.selectedIds.length })
            }
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
          <AssetTransactionTypeSelect
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
                  <AssetSelect<CategoryTypeData, ExpenseType>
                    label={props.t("expenseType")}
                    dataService={
                      new DataService<ExpenseType>({
                        context: expenseTypeContext,
                        fetchOptions: { order: { key: "ASC" } },
                      })
                    }
                    fieldName="expenseTypeId"
                    value={categoryTypeData.expenseTypeId}
                    onHandleChange={handleCategoryTypeChange}
                    size="small"
                    fullWidth
                    t={props.t}
                    translateKeyPrefix="expense-type"
                  />
                </Box>
              )}

              {transactionType === TransactionType.INCOME && (
                <Box sx={{ width: CATEGORY_DROPDOWN_WIDTH }}>
                  <AssetSelect<CategoryTypeData, IncomeType>
                    label={props.t("incomeType")}
                    dataService={
                      new DataService<IncomeType>({
                        context: incomeTypeContext,
                        fetchOptions: { order: { key: "ASC" } },
                      })
                    }
                    fieldName="incomeTypeId"
                    value={categoryTypeData.incomeTypeId}
                    onHandleChange={handleCategoryTypeChange}
                    size="small"
                    fullWidth
                    t={props.t}
                    translateKeyPrefix="income-type"
                  />
                </Box>
              )}
            </Stack>
          )}

          {/* Save button - always visible, disabled when no type selected */}
          <Box sx={{ mt: 2 }}>
            <AssetButton
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

        {/* Section 2: Automatic Allocation */}
        {(!props.hideSplitLoanPayment || props.onOpenAllocationRules || props.onAutoAllocate) && (
          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              p: 1.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: "bold" }}>
              {props.t("automaticAllocation")}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {props.onAutoAllocate && (
                <ButtonGroup variant="contained" size="small">
                  <Button
                    startIcon={<AutoFixHighIcon />}
                    onClick={props.onAutoAllocate}
                    disabled={props.autoAllocateDisabled || props.isAllocating}
                  >
                    {props.t("allocation:autoAllocate")}
                  </Button>
                  {props.onOpenAllocationRules && (
                    <Tooltip title={props.t("allocation:rules")}>
                      <Button
                        color="inherit"
                        onClick={props.onOpenAllocationRules}
                        sx={{ px: 1, minWidth: "auto" }}
                      >
                        <RuleIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  )}
                </ButtonGroup>
              )}
              {!props.onAutoAllocate && props.onOpenAllocationRules && (
                <AssetButton
                  label={props.t("allocation:rules")}
                  variant="outlined"
                  size="small"
                  startIcon={<RuleIcon />}
                  onClick={props.onOpenAllocationRules}
                />
              )}
              {!props.hideSplitLoanPayment && supportsLoanSplit && (
                <AssetButton
                  label={props.t("splitLoanPayment")}
                  variant="text"
                  onClick={handleLoanSplit}
                  endIcon={<CallSplitIcon />}
                />
              )}
            </Stack>

            {!props.hideSplitLoanPayment && !supportsLoanSplit && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {props.t("automaticAllocationNotSupported", { bank: props.bankName || "This" })}
              </Typography>
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
              <AssetButton
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
            {props.onResetAllocation && (
              <AssetButton
                label={props.t("resetAllocation")}
                variant="text"
                color="warning"
                onClick={props.onResetAllocation}
                disabled={!props.hasAllocatedSelected}
                tooltip={
                  !props.hasAllocatedSelected
                    ? props.t("resetAllocationDisabledTooltip")
                    : undefined
                }
                endIcon={<RestartAltIcon />}
              />
            )}
            <AssetButton
              label={props.t("delete")}
              variant="text"
              color="error"
              onClick={handleDeleteClick}
              endIcon={<DeleteIcon />}
            />
            <AssetButton
              label={props.t("cancel")}
              variant="text"
              onClick={handleCancel}
              endIcon={<AssetCloseIcon />}
            />
          </Stack>
        </Box>
      </Stack>

      <AssetConfirmDialog
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
