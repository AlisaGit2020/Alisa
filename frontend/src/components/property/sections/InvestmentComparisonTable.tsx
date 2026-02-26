import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  TextField,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { SavedInvestmentCalculation } from '../../investment-calculator/InvestmentCalculatorResults';
import AssetConfirmDialog from '../../asset/dialog/AssetConfirmDialog';
import { useToast } from '../../asset';
import ApiClient from '@asset-lib/api-client';

interface InvestmentComparisonTableProps {
  calculations: SavedInvestmentCalculation[];
  onUpdate: (calculation: SavedInvestmentCalculation) => void;
  onDelete: (id: number) => void;
}

// Input fields that are editable
const INPUT_FIELDS: (keyof SavedInvestmentCalculation)[] = [
  'deptFreePrice',
  'deptShare',
  'transferTaxPercent',
  'maintenanceFee',
  'chargeForFinancialCosts',
  'waterCharge',
  'rentPerMonth',
  'downPayment',
  'loanInterestPercent',
  'loanPeriod',
];

// Calculated output fields (read-only)
const OUTPUT_FIELDS_PURCHASE: (keyof SavedInvestmentCalculation)[] = [
  'sellingPrice',
  'transferTax',
  'pricePerSquareMeter',
];

const OUTPUT_FIELDS_LOAN: (keyof SavedInvestmentCalculation)[] = [
  'loanFinancing',
  'loanFirstMonthInstallment',
  'loanFirstMonthInterest',
];

const OUTPUT_FIELDS_INCOME: (keyof SavedInvestmentCalculation)[] = [
  'rentalIncomePerYear',
  'maintenanceCosts',
  'expensesPerMonth',
];

const OUTPUT_FIELDS_RETURNS: (keyof SavedInvestmentCalculation)[] = [
  'rentalYieldPercent',
  'cashFlowPerMonth',
  'cashFlowAfterTaxPerMonth',
  'profitPerYear',
  'taxPerYear',
  'taxDeductibleExpensesPerYear',
];

const PERCENT_FIELDS = ['transferTaxPercent', 'loanInterestPercent', 'rentalYieldPercent'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(2)} %`;
};

const getCashFlowColor = (value: number): string => {
  if (value > 0) return 'success.main';
  if (value < 0) return 'error.main';
  return 'text.primary';
};

const isCashFlowField = (field: string) => {
  return ['cashFlowPerMonth', 'cashFlowAfterTaxPerMonth', 'profitPerYear'].includes(field);
};

function InvestmentComparisonTable({
  calculations,
  onUpdate,
  onDelete,
}: InvestmentComparisonTableProps) {
  const { t } = useTranslation(['investment-calculator', 'property', 'common']);
  const { showToast } = useToast();
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const handleStartEdit = useCallback((id: number, field: keyof SavedInvestmentCalculation, value: number) => {
    setEditingCell({ id, field });
    setEditValue(String(value));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingCell) return;

    const calc = calculations.find((c) => c.id === editingCell.id);
    if (!calc) return;

    const updatedValue = parseFloat(editValue) || 0;

    // Update locally first
    const localUpdate = {
      ...calc,
      [editingCell.field]: updatedValue,
    } as SavedInvestmentCalculation;

    try {
      // Recalculate using the API
      const response = await ApiClient.post<SavedInvestmentCalculation>(
        'real-estate/investment/calculate',
        { ...localUpdate }
      );
      // ApiClient.post returns axios response, extract data
      const data = (response as unknown as { data: SavedInvestmentCalculation }).data;

      // Merge with original id and name if API succeeds
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        onUpdate({
          ...data,
          id: calc.id,
          name: calc.name,
        });
      } else {
        // API returned empty data, use local update
        onUpdate(localUpdate);
      }
    } catch {
      // Show error toast when API recalculation fails
      showToast(t('common:toast.updateError'), 'error');
      // Still update with local changes if API fails
      onUpdate(localUpdate);
    }

    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, calculations, onUpdate, showToast, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  const handleDeleteClick = useCallback((id: number) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTargetId !== null) {
      onDelete(deleteTargetId);
    }
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  }, [deleteTargetId, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  }, []);

  const getFieldLabel = (field: string) => {
    return t(`investment-calculator:${field}`);
  };

  const formatValue = (field: string, value: number) => {
    if (PERCENT_FIELDS.includes(field)) {
      return formatPercent(value);
    }
    return formatCurrency(value);
  };

  const renderInputCell = (calc: SavedInvestmentCalculation, field: keyof SavedInvestmentCalculation) => {
    const value = calc[field] as number;
    const isEditing = editingCell?.id === calc.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <TextField
          size="small"
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          autoFocus
          sx={{ width: 120 }}
          slotProps={{
            input: {
              sx: { fontSize: '0.875rem' },
            },
          }}
        />
      );
    }

    return (
      <Box
        onClick={() => handleStartEdit(calc.id, field, value)}
        sx={{ cursor: 'pointer' }}
      >
        <TextField
          size="small"
          type="number"
          value={value}
          sx={{ width: 120, pointerEvents: 'none' }}
          slotProps={{
            input: {
              readOnly: true,
              sx: { fontSize: '0.875rem' },
            },
          }}
        />
      </Box>
    );
  };

  const renderOutputCell = (calc: SavedInvestmentCalculation, field: keyof SavedInvestmentCalculation) => {
    const value = calc[field] as number;
    const isCashFlow = isCashFlowField(field);

    return (
      <Typography
        data-testid={`output-${field}-${calc.id}`}
        sx={{
          color: isCashFlow ? getCashFlowColor(value) : 'text.primary',
          fontWeight: isCashFlow ? 'bold' : 'normal',
        }}
      >
        {formatValue(field, value)}
      </Typography>
    );
  };

  const renderCashFlowCell = (calc: SavedInvestmentCalculation) => {
    const value = calc.cashFlowPerMonth;
    return (
      <Typography
        data-testid={`cashflow-cell-${calc.id}`}
        sx={{
          color: getCashFlowColor(value),
          fontWeight: 'bold',
        }}
      >
        {formatCurrency(value)}
      </Typography>
    );
  };

  if (calculations.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          {t('property:noCalculations')}
        </Typography>
      </Box>
    );
  }

  const stickyColumnStyle = {
    position: 'sticky' as const,
    left: 0,
    backgroundColor: 'background.paper',
    zIndex: 1,
  };

  return (
    <Box>
      <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell
                data-testid="label-column"
                sx={{
                  ...stickyColumnStyle,
                  fontWeight: 'bold',
                  minWidth: 180,
                }}
              >
                {/* Empty header for label column */}
              </TableCell>
              {calculations.map((calc) => (
                <TableCell
                  key={calc.id}
                  align="center"
                  sx={{ minWidth: 150 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Typography fontWeight="bold">{calc.name || `#${calc.id}`}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(calc.id)}
                      aria-label={t('common:delete')}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Input Fields Section */}
            <TableRow>
              <TableCell
                colSpan={calculations.length + 1}
                sx={{ backgroundColor: 'grey.100', fontWeight: 'bold' }}
              >
                <Typography variant="subtitle2" sx={{ textTransform: 'uppercase' }}>
                  {t('property:inputFields')}
                </Typography>
              </TableCell>
            </TableRow>
            {INPUT_FIELDS.map((field) => (
              <TableRow key={field} hover>
                <TableCell sx={stickyColumnStyle}>
                  {getFieldLabel(field)}
                </TableCell>
                {calculations.map((calc) => (
                  <TableCell key={calc.id} align="center">
                    {renderInputCell(calc, field)}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* Purchase Costs Section */}
            <TableRow>
              <TableCell
                colSpan={calculations.length + 1}
                sx={{ backgroundColor: 'grey.100', fontWeight: 'bold' }}
              >
                <Typography variant="subtitle2" sx={{ textTransform: 'uppercase' }}>
                  {t('investment-calculator:purchaseCosts')}
                </Typography>
              </TableCell>
            </TableRow>
            {OUTPUT_FIELDS_PURCHASE.map((field) => (
              <TableRow key={field} hover>
                <TableCell sx={stickyColumnStyle}>
                  {getFieldLabel(field)}
                </TableCell>
                {calculations.map((calc) => (
                  <TableCell key={calc.id} align="center">
                    {renderOutputCell(calc, field)}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* Loan Details Section */}
            <TableRow>
              <TableCell
                colSpan={calculations.length + 1}
                sx={{ backgroundColor: 'grey.100', fontWeight: 'bold' }}
              >
                <Typography variant="subtitle2" sx={{ textTransform: 'uppercase' }}>
                  {t('investment-calculator:loanDetails')}
                </Typography>
              </TableCell>
            </TableRow>
            {OUTPUT_FIELDS_LOAN.map((field) => (
              <TableRow key={field} hover>
                <TableCell sx={stickyColumnStyle}>
                  {getFieldLabel(field)}
                </TableCell>
                {calculations.map((calc) => (
                  <TableCell key={calc.id} align="center">
                    {renderOutputCell(calc, field)}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* Income & Expenses Section */}
            <TableRow>
              <TableCell
                colSpan={calculations.length + 1}
                sx={{ backgroundColor: 'grey.100', fontWeight: 'bold' }}
              >
                <Typography variant="subtitle2" sx={{ textTransform: 'uppercase' }}>
                  {t('investment-calculator:incomeAndExpenses')}
                </Typography>
              </TableCell>
            </TableRow>
            {OUTPUT_FIELDS_INCOME.map((field) => (
              <TableRow key={field} hover>
                <TableCell sx={stickyColumnStyle}>
                  {getFieldLabel(field)}
                </TableCell>
                {calculations.map((calc) => (
                  <TableCell key={calc.id} align="center">
                    {renderOutputCell(calc, field)}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* Returns Section */}
            <TableRow>
              <TableCell
                colSpan={calculations.length + 1}
                sx={{ backgroundColor: 'grey.100', fontWeight: 'bold' }}
              >
                <Typography variant="subtitle2" sx={{ textTransform: 'uppercase' }}>
                  {t('investment-calculator:returns')}
                </Typography>
              </TableCell>
            </TableRow>
            {OUTPUT_FIELDS_RETURNS.map((field) => (
              <TableRow key={field} hover>
                <TableCell sx={stickyColumnStyle}>
                  {getFieldLabel(field)}
                </TableCell>
                {calculations.map((calc) => (
                  <TableCell key={calc.id} align="center">
                    {field === 'cashFlowPerMonth' ? renderCashFlowCell(calc) : renderOutputCell(calc, field)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AssetConfirmDialog
        open={deleteDialogOpen}
        title={t('common:confirmDelete')}
        contentText={t('property:deleteCalculationConfirm')}
        buttonTextCancel={t('common:cancel')}
        buttonTextConfirm={t('common:confirm')}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </Box>
  );
}

export default InvestmentComparisonTable;
