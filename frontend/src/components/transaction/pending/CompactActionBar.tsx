import {
  expenseTypeContext,
  incomeTypeContext,
} from "@asset-lib/asset-contexts.ts";
import { TransactionType, ExpenseType, IncomeType } from "@asset-types";
import {
  Box,
  Chip,
  Collapse,
  Divider,
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
  AssetTransactionTypeSelect,
  AssetSelect,
} from "../../asset";
import React from "react";
import DataService from "@asset-lib/data-service.ts";
import { TFunction } from "i18next";

interface CategoryTypeData {
  expenseTypeId: number;
  incomeTypeId: number;
}

export interface CompactActionBarProps {
  t: TFunction;
  open: boolean;
  marginTop?: number;
  selectedIds: number[];
  hasUnallocatedSelected?: boolean;
  hideApprove?: boolean;
  hideSplitLoanPayment?: boolean;
  supportsLoanSplit?: boolean;
  bankName?: string;
  hasAllocatedSelected?: boolean;
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
}

export default function CompactActionBar(props: CompactActionBarProps) {
  const [transactionType, setTransactionType] = React.useState<number>(0);
  const [expanded, setExpanded] = React.useState<boolean>(false);
  const [categoryTypeData, setCategoryTypeData] = React.useState<CategoryTypeData>({
    expenseTypeId: 0,
    incomeTypeId: 0,
  });

  const handleSave = async () => {
    if (transactionType > 0) {
      await props.onSetType(transactionType);
    }
    if (categoryTypeData.expenseTypeId > 0 || categoryTypeData.incomeTypeId > 0) {
      await props.onSetCategoryType(
        categoryTypeData.expenseTypeId > 0 ? categoryTypeData.expenseTypeId : undefined,
        categoryTypeData.incomeTypeId > 0 ? categoryTypeData.incomeTypeId : undefined,
      );
    }
    setTransactionType(0);
    setCategoryTypeData({ expenseTypeId: 0, incomeTypeId: 0 });
    props.onCancel();
  };

  const handleTypeChange = (type: number) => {
    setTransactionType(type);
    setCategoryTypeData({ expenseTypeId: 0, incomeTypeId: 0 });
  };

  const handleCategoryTypeChange = (fieldName: keyof CategoryTypeData, value: number) => {
    setCategoryTypeData({ ...categoryTypeData, [fieldName]: value });
  };

  const handleLoanSplit = async () => {
    await props.onSplitLoanPayment();
  };

  const handleCancel = () => {
    setTransactionType(0);
    setCategoryTypeData({ expenseTypeId: 0, incomeTypeId: 0 });
    props.onCancel();
  };

  const isSaveDisabled =
    transactionType <= 0 ||
    (transactionType === TransactionType.EXPENSE && categoryTypeData.expenseTypeId <= 0) ||
    (transactionType === TransactionType.INCOME && categoryTypeData.incomeTypeId <= 0);

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
        padding: 1,
        position: "sticky",
        top: 0,
        zIndex: 10,
        borderRadius: 2,
      }}
      elevation={3}
      data-testid="compact-action-bar"
    >
      {/* Main compact bar */}
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        {/* Selection count */}
        <Chip
          label={props.selectedIds.length}
          color="primary"
          size="small"
          data-testid="selection-count"
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
              data-testid="save-button"
            >
              <SaveIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Auto-allocate */}
        {props.onAutoAllocate && (
          <Tooltip title={props.t("allocation:autoAllocate")}>
            <span>
              <IconButton
                color="primary"
                onClick={props.onAutoAllocate}
                disabled={props.autoAllocateDisabled || props.isAllocating}
                size="small"
                data-testid="auto-allocate-button"
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
              data-testid="rules-button"
            >
              <RuleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Reset allocation - important action for allocated rows */}
        {props.onResetAllocation && (
          <Tooltip
            title={
              !props.hasAllocatedSelected
                ? props.t("resetAllocationDisabledTooltip")
                : props.t("resetAllocation")
            }
          >
            <span>
              <IconButton
                color="warning"
                onClick={props.onResetAllocation}
                disabled={!props.hasAllocatedSelected}
                size="small"
                data-testid="reset-allocation-button"
              >
                <RestartAltIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}

        <Divider orientation="vertical" flexItem />

        {/* Delete */}
        <Tooltip title={props.t("delete")}>
          <IconButton
            color="error"
            onClick={props.onDelete}
            size="small"
            data-testid="delete-button"
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>

        {/* Cancel/Close */}
        <Tooltip title={props.t("cancel")}>
          <IconButton onClick={handleCancel} size="small" data-testid="cancel-button">
            <AssetCloseIcon />
          </IconButton>
        </Tooltip>

        {/* Expand toggle for more options */}
        <Tooltip title={expanded ? props.t("common:showLess") : props.t("common:showMore")}>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            data-testid="expand-button"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Expanded section for less common actions */}
      <Collapse in={expanded} data-testid="expanded-section">
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

          {/* Accept (if shown) */}
          {!props.hideApprove && (
            <AssetButton
              label={props.t("accept")}
              variant="text"
              size="small"
              color="success"
              onClick={props.onApprove}
              disabled={props.hasUnallocatedSelected}
              tooltip={props.hasUnallocatedSelected ? props.t("acceptDisabledTooltip") : undefined}
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
  );
}
