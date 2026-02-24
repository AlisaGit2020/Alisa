import {
  expenseTypeContext,
  incomeTypeContext,
} from "@asset-lib/asset-contexts.ts";
import { TransactionType, ExpenseType, IncomeType } from "@asset-types";
import {
  Button,
  ButtonGroup,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Menu,
  MenuItem,
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
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { AssetCloseIcon } from "../../asset/AssetIcons.tsx";
import Typography from "@mui/material/Typography";
import { AssetButton } from "../../asset";
import React, { useEffect } from "react";
import DataService from "@asset-lib/data-service.ts";
import { TFunction } from "i18next";

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
  const [expanded, setExpanded] = React.useState<boolean>(false);
  const [expenseMenuAnchor, setExpenseMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [incomeMenuAnchor, setIncomeMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [expenseTypes, setExpenseTypes] = React.useState<ExpenseType[]>([]);
  const [incomeTypes, setIncomeTypes] = React.useState<IncomeType[]>([]);

  // Selected type and category
  const [selectedType, setSelectedType] = React.useState<TransactionType | null>(null);
  const [selectedExpenseTypeId, setSelectedExpenseTypeId] = React.useState<number | null>(null);
  const [selectedIncomeTypeId, setSelectedIncomeTypeId] = React.useState<number | null>(null);

  // Load expense and income types
  useEffect(() => {
    const loadTypes = async () => {
      const expenseService = new DataService<ExpenseType>({
        context: expenseTypeContext,
        fetchOptions: { order: { key: "ASC" } },
      });
      const incomeService = new DataService<IncomeType>({
        context: incomeTypeContext,
        fetchOptions: { order: { key: "ASC" } },
      });

      const [expenses, incomes] = await Promise.all([
        expenseService.search(),
        incomeService.search(),
      ]);

      setExpenseTypes(expenses);
      setIncomeTypes(incomes);
    };

    if (props.open) {
      loadTypes();
    }
  }, [props.open]);

  const handleExpenseClick = (event: React.MouseEvent<HTMLElement>) => {
    setExpenseMenuAnchor(event.currentTarget);
  };

  const handleIncomeClick = (event: React.MouseEvent<HTMLElement>) => {
    setIncomeMenuAnchor(event.currentTarget);
  };

  const handleExpenseSelect = (expenseTypeId: number) => {
    setExpenseMenuAnchor(null);
    setSelectedType(TransactionType.EXPENSE);
    setSelectedExpenseTypeId(expenseTypeId);
    setSelectedIncomeTypeId(null);
  };

  const handleIncomeSelect = (incomeTypeId: number) => {
    setIncomeMenuAnchor(null);
    setSelectedType(TransactionType.INCOME);
    setSelectedIncomeTypeId(incomeTypeId);
    setSelectedExpenseTypeId(null);
  };

  const handleDepositClick = () => {
    setSelectedType(TransactionType.DEPOSIT);
    setSelectedExpenseTypeId(null);
    setSelectedIncomeTypeId(null);
  };

  const handleWithdrawClick = () => {
    setSelectedType(TransactionType.WITHDRAW);
    setSelectedExpenseTypeId(null);
    setSelectedIncomeTypeId(null);
  };

  const handleSave = async () => {
    if (selectedType !== null) {
      await props.onSetType(selectedType);
      if (selectedExpenseTypeId) {
        await props.onSetCategoryType(selectedExpenseTypeId, undefined);
      } else if (selectedIncomeTypeId) {
        await props.onSetCategoryType(undefined, selectedIncomeTypeId);
      }
      // Reset selection and deselect rows
      setSelectedType(null);
      setSelectedExpenseTypeId(null);
      setSelectedIncomeTypeId(null);
      props.onCancel();
    }
  };

  const handleLoanSplit = async () => {
    await props.onSplitLoanPayment();
  };

  const handleCancel = () => {
    setSelectedType(null);
    setSelectedExpenseTypeId(null);
    setSelectedIncomeTypeId(null);
    props.onCancel();
  };

  const supportsLoanSplit = props.supportsLoanSplit ?? true;

  // Get selected category name for display
  const getSelectedCategoryName = (): string | null => {
    if (selectedType === TransactionType.EXPENSE && selectedExpenseTypeId) {
      const expenseType = expenseTypes.find((t) => t.id === selectedExpenseTypeId);
      return expenseType ? props.t(`expense-type:${expenseType.key}`) : null;
    }
    if (selectedType === TransactionType.INCOME && selectedIncomeTypeId) {
      const incomeType = incomeTypes.find((t) => t.id === selectedIncomeTypeId);
      return incomeType ? props.t(`income-type:${incomeType.key}`) : null;
    }
    return null;
  };

  // Save is disabled if no type selected, or if EXPENSE/INCOME selected without category
  const isSaveDisabled =
    selectedType === null ||
    (selectedType === TransactionType.EXPENSE && !selectedExpenseTypeId) ||
    (selectedType === TransactionType.INCOME && !selectedIncomeTypeId);

  const selectedCategoryName = getSelectedCategoryName();

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

        {/* Type buttons with dropdown for Income/Expense */}
        <ButtonGroup variant="outlined" size="small">
          {/* Income with dropdown */}
          <Button
            onClick={handleIncomeClick}
            endIcon={<ArrowDropDownIcon />}
            variant={selectedType === TransactionType.INCOME ? "contained" : "outlined"}
            data-testid="income-button"
          >
            {selectedType === TransactionType.INCOME && selectedCategoryName
              ? selectedCategoryName
              : props.t("income")}
          </Button>

          {/* Expense with dropdown */}
          <Button
            onClick={handleExpenseClick}
            endIcon={<ArrowDropDownIcon />}
            variant={selectedType === TransactionType.EXPENSE ? "contained" : "outlined"}
            data-testid="expense-button"
          >
            {selectedType === TransactionType.EXPENSE && selectedCategoryName
              ? selectedCategoryName
              : props.t("expense")}
          </Button>

          {/* Deposit - simple button */}
          <Button
            onClick={handleDepositClick}
            variant={selectedType === TransactionType.DEPOSIT ? "contained" : "outlined"}
            data-testid="deposit-button"
          >
            {props.t("deposit")}
          </Button>

          {/* Withdraw - simple button */}
          <Button
            onClick={handleWithdrawClick}
            variant={selectedType === TransactionType.WITHDRAW ? "contained" : "outlined"}
            data-testid="withdraw-button"
          >
            {props.t("withdraw")}
          </Button>
        </ButtonGroup>

        {/* Income categories menu */}
        <Menu
          anchorEl={incomeMenuAnchor}
          open={Boolean(incomeMenuAnchor)}
          onClose={() => setIncomeMenuAnchor(null)}
          data-testid="income-menu"
        >
          {incomeTypes.map((type) => (
            <MenuItem
              key={type.id}
              onClick={() => handleIncomeSelect(type.id)}
              selected={selectedIncomeTypeId === type.id}
            >
              {props.t(`income-type:${type.key}`)}
            </MenuItem>
          ))}
        </Menu>

        {/* Expense categories menu */}
        <Menu
          anchorEl={expenseMenuAnchor}
          open={Boolean(expenseMenuAnchor)}
          onClose={() => setExpenseMenuAnchor(null)}
          data-testid="expense-menu"
        >
          {expenseTypes.map((type) => (
            <MenuItem
              key={type.id}
              onClick={() => handleExpenseSelect(type.id)}
              selected={selectedExpenseTypeId === type.id}
            >
              {props.t(`expense-type:${type.key}`)}
            </MenuItem>
          ))}
        </Menu>

        {/* Save button */}
        <Tooltip title={isSaveDisabled ? props.t("saveAllocationTooltip") : props.t("save")}>
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
