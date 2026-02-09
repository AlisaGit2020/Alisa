import { WithTranslation, withTranslation } from "react-i18next";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ApiClient from "@alisa-lib/api-client";
import { useNavigate } from "react-router-dom";
import { AlisaButton, AlisaConfirmDialog } from "../alisa";
import InvestmentCalculationViewDialog from "./InvestmentCalculationViewDialog";
import InvestmentCalculationEditDialog from "./InvestmentCalculationEditDialog";

interface SavedCalculation {
  id: number;
  name?: string;
  userId: number;
  propertyId?: number;
  deptFreePrice: number;
  rentPerMonth: number;
  cashFlowPerMonth: number;
  rentalYieldPercent: number;
  createdAt?: string;
}

interface SavedCalculationsProps extends WithTranslation {
  compact?: boolean;
  onNewCalculation?: () => void;
}

function SavedCalculations({ t, compact = false, onNewCalculation }: SavedCalculationsProps) {
  const [calculations, setCalculations] = React.useState<SavedCalculation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedCalculationId, setSelectedCalculationId] = React.useState<number | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = async () => {
    try {
      const data = await ApiClient.search<SavedCalculation>('real-estate/investment', {});
      setCalculations(data);
    } catch (error) {
      console.error('Error loading calculations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOpen = (id: number) => {
    setSelectedCalculationId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteClose = () => {
    setSelectedCalculationId(null);
    setDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (selectedCalculationId) {
      try {
        await ApiClient.delete('real-estate/investment', selectedCalculationId);
        await loadCalculations();
      } catch (error) {
        console.error('Error deleting calculation:', error);
      }
    }
    handleDeleteClose();
  };

  const handleViewOpen = (id: number) => {
    setSelectedCalculationId(id);
    setViewDialogOpen(true);
  };

  const handleViewClose = () => {
    setSelectedCalculationId(null);
    setViewDialogOpen(false);
  };

  const handleEditOpen = (id: number) => {
    setSelectedCalculationId(id);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setSelectedCalculationId(null);
    setEditDialogOpen(false);
  };

  const handleRowClick = (id: number) => {
    handleViewOpen(id);
  };

  const handleNewCalculation = () => {
    if (onNewCalculation) {
      onNewCalculation();
    } else {
      navigate('/investment-calculator');
    }
  };

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

  if (loading) {
    return (
      <Box>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant={compact ? "h6" : "h4"} component={compact ? "h2" : "h1"}>
          {t('investment-calculator:savedCalculations')}
        </Typography>
        {!compact && (
          <AlisaButton
            label={t('investment-calculator:newCalculation')}
            onClick={handleNewCalculation}
          />
        )}
      </Box>

      {calculations.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              {t('investment-calculator:noCalculations')}
            </Typography>
            {!compact && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <AlisaButton
                  label={t('investment-calculator:newCalculation')}
                  onClick={handleNewCalculation}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('investment-calculator:name')}</TableCell>
                <TableCell align="right">{t('investment-calculator:deptFreePrice')}</TableCell>
                <TableCell align="right">{t('investment-calculator:rentPerMonth')}</TableCell>
                <TableCell align="right">{t('investment-calculator:cashFlowPerMonth')}</TableCell>
                <TableCell align="right">{t('investment-calculator:rentalYieldPercent')}</TableCell>
                <TableCell align="right">{t('investment-calculator:actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calculations.map((calc) => (
                <TableRow
                  key={calc.id}
                  hover
                  onClick={() => handleRowClick(calc.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{calc.name || `#${calc.id}`}</TableCell>
                  <TableCell align="right">{formatCurrency(calc.deptFreePrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(calc.rentPerMonth)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: calc.cashFlowPerMonth > 0 ? 'success.main' :
                             calc.cashFlowPerMonth < 0 ? 'error.main' : 'text.primary'
                    }}
                  >
                    {formatCurrency(calc.cashFlowPerMonth)}
                  </TableCell>
                  <TableCell align="right">{formatPercent(calc.rentalYieldPercent)}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditOpen(calc.id)}
                      title={t('investment-calculator:edit')}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteOpen(calc.id)}
                      title={t('investment-calculator:delete')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AlisaConfirmDialog
        title={t('common:confirm')}
        contentText={t('investment-calculator:deleteConfirm')}
        buttonTextConfirm={t('common:delete')}
        buttonTextCancel={t('common:cancel')}
        open={deleteDialogOpen}
        onConfirm={handleDelete}
        onClose={handleDeleteClose}
      />

      <InvestmentCalculationViewDialog
        calculationId={selectedCalculationId || 0}
        open={viewDialogOpen}
        onClose={handleViewClose}
        onSaved={loadCalculations}
      />

      <InvestmentCalculationEditDialog
        calculationId={selectedCalculationId || 0}
        open={editDialogOpen}
        onClose={handleEditClose}
        onSaved={loadCalculations}
      />
    </Box>
  );
}

export default withTranslation(['investment-calculator'])(SavedCalculations);
