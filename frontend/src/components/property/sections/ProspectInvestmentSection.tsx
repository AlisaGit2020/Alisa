import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Property } from '@asset-types';
import { SavedInvestmentCalculation } from '../../investment-calculator/InvestmentCalculatorResults';
import { AssetButton } from '../../asset';
import InvestmentComparisonTable from './InvestmentComparisonTable';
import InvestmentAddDialog from './InvestmentAddDialog';
import ApiClient from '@asset-lib/api-client';

interface ProspectInvestmentSectionProps {
  property: Property;
}

function ProspectInvestmentSection({ property }: ProspectInvestmentSectionProps) {
  const { t } = useTranslation(['property', 'investment-calculator', 'common']);
  const [calculations, setCalculations] = useState<SavedInvestmentCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const fetchCalculations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.search<SavedInvestmentCalculation>(
        'real-estate/investment',
        {
          where: { propertyId: property.id },
        }
      );
      setCalculations(data);
    } catch (err) {
      console.error('Failed to fetch calculations:', err);
      setError(t('common:toast.error'));
    } finally {
      setLoading(false);
    }
  }, [property.id, t]);

  useEffect(() => {
    fetchCalculations();
  }, [fetchCalculations]);

  const handleUpdate = useCallback(async (updatedCalc: SavedInvestmentCalculation) => {
    // Update local state optimistically
    setCalculations((prev) =>
      prev.map((calc) => (calc.id === updatedCalc.id ? updatedCalc : calc))
    );

    // Persist to backend
    try {
      await ApiClient.put('real-estate/investment', updatedCalc.id, updatedCalc);
    } catch (err) {
      console.error('Failed to save calculation:', err);
      // Refetch on error
      fetchCalculations();
    }
  }, [fetchCalculations]);

  const handleDelete = useCallback(async (id: number) => {
    // Remove from local state optimistically
    setCalculations((prev) => prev.filter((calc) => calc.id !== id));

    // Delete from backend
    try {
      await ApiClient.delete('real-estate/investment', id);
    } catch (err) {
      console.error('Failed to delete calculation:', err);
      // Refetch on error
      fetchCalculations();
    }
  }, [fetchCalculations]);

  const handleAddDialogOpen = useCallback(() => {
    setAddDialogOpen(true);
  }, []);

  const handleAddDialogClose = useCallback(() => {
    setAddDialogOpen(false);
  }, []);

  const handleSave = useCallback((saved: SavedInvestmentCalculation) => {
    setCalculations((prev) => [...prev, saved]);
    setAddDialogOpen(false);
  }, []);

  // Calculate responsive width based on number of calculations
  // 1 calc = 50%, 2 = 75%, 3+ = 100%
  const getTableMaxWidth = () => {
    if (calculations.length === 0) return '100%';
    if (calculations.length === 1) return { xs: '100%', md: '50%' };
    if (calculations.length === 2) return { xs: '100%', md: '75%' };
    return '100%';
  };

  return (
    <Box sx={{ p: 2 }}>
      {loading && (
        <Box>
          <Box data-testid="add-calculation-container" sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <AssetButton
              label={t('property:addCalculation')}
              startIcon={<AddIcon />}
              onClick={handleAddDialogOpen}
              variant="outlined"
              size="small"
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress role="progressbar" />
          </Box>
        </Box>
      )}

      {error && (
        <Box>
          <Box data-testid="add-calculation-container" sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <AssetButton
              label={t('property:addCalculation')}
              startIcon={<AddIcon />}
              onClick={handleAddDialogOpen}
              variant="outlined"
              size="small"
            />
          </Box>
          <Alert severity="error">
            {error}
          </Alert>
        </Box>
      )}

      {!loading && !error && (
        <Box data-testid="table-wrapper" sx={{ maxWidth: getTableMaxWidth() }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 500 }}
            >
              {t('property:investmentCalculations')}
            </Typography>
            <Box data-testid="add-calculation-container">
              <AssetButton
                label={t('property:addCalculation')}
                startIcon={<AddIcon />}
                onClick={handleAddDialogOpen}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
          <InvestmentComparisonTable
            calculations={calculations}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </Box>
      )}

      <InvestmentAddDialog
        open={addDialogOpen}
        property={property}
        onClose={handleAddDialogClose}
        onSave={handleSave}
      />
    </Box>
  );
}

export default ProspectInvestmentSection;
