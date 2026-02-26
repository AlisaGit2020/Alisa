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

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}
        >
          {t('property:investmentAnalysis')} - {property.name}
        </Typography>
        <AssetButton
          label={t('property:addCalculation')}
          startIcon={<AddIcon />}
          onClick={handleAddDialogOpen}
          variant="outlined"
          size="small"
        />
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress role="progressbar" />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
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
