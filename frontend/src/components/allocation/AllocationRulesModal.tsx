import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import AssetDialog from "../asset/dialog/AssetDialog";
import AssetButton from "../asset/form/AssetButton";
import AssetConfirmDialog from "../asset/dialog/AssetConfirmDialog";
import AllocationRuleForm from "./AllocationRuleForm";
import ApiClient from "@asset-lib/api-client";
import { useAssetToast } from "../asset/toast/AssetToastProvider";
import {
  AllocationRule,
  TransactionType,
  AllocationRuleInput,
  AllocationCondition,
} from "@asset-types";
import { AssetSelectFieldItem } from "../asset/form/AssetSelectField";

interface AllocationRulesModalProps {
  open: boolean;
  propertyId: number;
  propertyName?: string;
  onClose: () => void;
}

interface ExpenseType {
  id: number;
  key: string;
}

interface IncomeType {
  id: number;
  key: string;
}

const API_PATH = "allocation-rules";

function AllocationRulesModal({
  open,
  propertyId,
  propertyName,
  onClose,
}: AllocationRulesModalProps) {
  const { t } = useTranslation();
  const { showToast } = useAssetToast();

  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<AssetSelectFieldItem[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<AssetSelectFieldItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<AllocationRule> | null>(
    null
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AllocationRule | null>(null);
  const [errors, setErrors] = useState<{ name?: string; conditions?: string }>(
    {}
  );

  const loadRules = useCallback(async () => {
    if (!propertyId) return;

    setLoading(true);
    try {
      const data = await ApiClient.fetch<AllocationRule[]>(
        `${API_PATH}/property/${propertyId}`
      );
      setRules(data);
    } catch (error) {
      console.error("Failed to load rules:", error);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const loadTypes = useCallback(async () => {
    try {
      const [expenseData, incomeData] = await Promise.all([
        ApiClient.search<ExpenseType>("accounting/expense/type"),
        ApiClient.search<IncomeType>("accounting/income/type"),
      ]);

      setExpenseTypes(expenseData.map((et) => ({ id: et.id, key: et.key })));
      setIncomeTypes(incomeData.map((it) => ({ id: it.id, key: it.key })));
    } catch (error) {
      console.error("Failed to load types:", error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadRules();
      loadTypes();
    }
  }, [open, loadRules, loadTypes]);

  const handleAddRule = () => {
    setEditingRule({
      propertyId,
      name: "",
      transactionType: TransactionType.EXPENSE,
      conditions: [{ field: "description", operator: "contains", value: "" }],
      isActive: true,
    });
    setErrors({});
  };

  const handleEditRule = (rule: AllocationRule) => {
    setEditingRule({ ...rule });
    setErrors({});
  };

  const handleDeleteClick = (rule: AllocationRule) => {
    setRuleToDelete(rule);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ruleToDelete) return;

    try {
      await ApiClient.delete(API_PATH, ruleToDelete.id);
      showToast({ message: t("common:toast.deleteSuccess"), severity: "success" });
      loadRules();
    } catch (error) {
      console.error("Failed to delete rule:", error);
      showToast({ message: t("common:toast.deleteError"), severity: "error" });
    } finally {
      setDeleteConfirmOpen(false);
      setRuleToDelete(null);
    }
  };

  const validateRule = (rule: Partial<AllocationRule>): boolean => {
    const newErrors: { name?: string; conditions?: string } = {};

    if (!rule.name?.trim()) {
      newErrors.name = t("common:validation.required");
    }

    if (!rule.conditions?.length) {
      newErrors.conditions = t("allocation:atLeastOneCondition");
    } else if (rule.conditions.some((c) => !c.value.trim())) {
      newErrors.conditions = t("common:validation.required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveRule = async () => {
    if (!editingRule || !validateRule(editingRule)) return;

    const input: AllocationRuleInput = {
      name: editingRule.name || "",
      propertyId,
      transactionType: editingRule.transactionType || TransactionType.EXPENSE,
      expenseTypeId: editingRule.expenseTypeId,
      incomeTypeId: editingRule.incomeTypeId,
      conditions: editingRule.conditions as AllocationCondition[],
      isActive: editingRule.isActive,
    };

    try {
      if (editingRule.id) {
        await ApiClient.put(API_PATH, editingRule.id, input);
      } else {
        await ApiClient.post(API_PATH, input);
      }

      showToast({ message: t("common:toast.saveSuccess"), severity: "success" });
      setEditingRule(null);
      loadRules();
    } catch (error) {
      console.error("Failed to save rule:", error);
      showToast({ message: t("common:toast.saveError"), severity: "error" });
    }
  };

  const handleCancelEdit = () => {
    setEditingRule(null);
    setErrors({});
  };

  const getConditionsSummary = (rule: AllocationRule): string => {
    return rule.conditions
      .map((c) => `${t(`allocation:field.${c.field}`)} ${t(`allocation:operator.${c.operator}`)} "${c.value}"`)
      .join(", ");
  };

  const getTypeName = (type: TransactionType): string => {
    switch (type) {
      case TransactionType.EXPENSE:
        return t("transaction:expense");
      case TransactionType.INCOME:
        return t("transaction:income");
      case TransactionType.DEPOSIT:
        return t("transaction:deposit");
      case TransactionType.WITHDRAW:
        return t("transaction:withdraw");
      default:
        return t("common:unknown");
    }
  };

  const getExpenseTypeName = (expenseTypeId: number | null | undefined): string | null => {
    if (!expenseTypeId) return null;
    const expenseType = expenseTypes.find((et) => et.id === expenseTypeId);
    return expenseType ? t(`expense-type:${expenseType.key}`) : null;
  };

  const getIncomeTypeName = (incomeTypeId: number | null | undefined): string | null => {
    if (!incomeTypeId) return null;
    const incomeType = incomeTypes.find((it) => it.id === incomeTypeId);
    return incomeType ? t(`income-type:${incomeType.key}`) : null;
  };

  if (editingRule) {
    return (
      <AssetDialog
        open={open}
        title={editingRule.id ? t("allocation:editRule") : t("allocation:addRule")}
        onClose={handleCancelEdit}
        actions={
          <>
            <AssetButton label={t("common:cancel")} variant="text" onClick={handleCancelEdit} />
            <AssetButton label={t("common:save")} variant="contained" onClick={handleSaveRule} />
          </>
        }
      >
        <AllocationRuleForm
          rule={editingRule}
          expenseTypes={expenseTypes}
          incomeTypes={incomeTypes}
          t={t}
          onChange={setEditingRule}
          errors={errors}
        />
      </AssetDialog>
    );
  }

  return (
    <>
      <AssetDialog
        open={open}
        title={propertyName ? `${t("allocation:rules")}: ${propertyName}` : t("allocation:rules")}
        onClose={onClose}
        maxWidth="md"
        actions={
          <>
            <AssetButton
              label={t("allocation:addRule")}
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddRule}
            />
            <AssetButton label={t("common:close")} variant="text" onClick={onClose} />
          </>
        }
      >
        {loading ? (
          <Typography>{t("common:loading")}</Typography>
        ) : rules.length === 0 ? (
          <Typography color="text.secondary">
            {t("allocation:noRules")}
          </Typography>
        ) : (
          <List disablePadding>
            {rules.map((rule, index) => (
              <ListItem
                key={rule.id}
                divider={index < rules.length - 1}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label={t("common:edit")}
                      onClick={() => handleEditRule(rule)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label={t("common:delete")}
                      onClick={() => handleDeleteClick(rule)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {rule.name}
                        {!rule.isActive && (
                          <Chip
                            label={t("allocation:inactive")}
                            size="small"
                            color="warning"
                          />
                        )}
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Chip
                          label={getTypeName(rule.transactionType)}
                          size="small"
                          color={
                            rule.transactionType === TransactionType.INCOME
                              ? "success"
                              : rule.transactionType === TransactionType.EXPENSE
                                ? "error"
                                : "default"
                          }
                        />
                        {rule.transactionType === TransactionType.EXPENSE &&
                          getExpenseTypeName(rule.expenseTypeId) && (
                            <Chip
                              label={getExpenseTypeName(rule.expenseTypeId)}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        {rule.transactionType === TransactionType.INCOME &&
                          getIncomeTypeName(rule.incomeTypeId) && (
                            <Chip
                              label={getIncomeTypeName(rule.incomeTypeId)}
                              size="small"
                              variant="outlined"
                            />
                          )}
                      </Box>
                    </Box>
                  }
                  secondary={getConditionsSummary(rule)}
                />
              </ListItem>
            ))}
          </List>
        )}
      </AssetDialog>

      <AssetConfirmDialog
        open={deleteConfirmOpen}
        title={t("common:confirmDelete")}
        contentText={t("common:confirmDeleteMessage")}
        buttonTextCancel={t("common:cancel")}
        buttonTextConfirm={t("common:delete")}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setRuleToDelete(null);
        }}
      />
    </>
  );
}

export default AllocationRulesModal;
