import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListSubheader,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Divider,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AddIcon from '@mui/icons-material/Add';
import { AssetButton, AssetConfirmDialog, useToast } from '../asset';
import ApiClient from '@asset-lib/api-client';
import { SavedInvestmentCalculation } from './InvestmentCalculatorResults';
import { Property } from '@asset-types';
import { PropertyStatus } from '@asset-types/common';
import CalculationListItem from './CalculationListItem';
import ComparisonDropZone from './ComparisonDropZone';
import InvestmentAddDialog from '../property/sections/InvestmentAddDialog';

interface CalculationWithProperty extends SavedInvestmentCalculation {
  property?: Property;
  propertyId?: number;
}

const MAX_CALCULATIONS = 5;

interface ProspectCompareViewProps {
  standalone?: boolean;
}

function ProspectCompareView({ standalone = false }: ProspectCompareViewProps) {
  const { t } = useTranslation(['investment-calculator', 'common', 'property']);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [calculations, setCalculations] = useState<CalculationWithProperty[]>([]);
  const [prospects, setProspects] = useState<Property[]>([]);
  const [comparisonCalculations, setComparisonCalculations] = useState<SavedInvestmentCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addDialogProperty, setAddDialogProperty] = useState<Property | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const fetchCalculations = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [calculationsData, prospectsData] = await Promise.all([
        ApiClient.search<CalculationWithProperty>('real-estate/investment', {
          relations: { property: { address: true } },
          order: { name: 'ASC' },
        }),
        ApiClient.search<Property>('real-estate/property', {
          where: { status: PropertyStatus.PROSPECT },
          relations: { address: true },
          order: { name: 'ASC' },
        }),
      ]);
      setCalculations(calculationsData);
      setProspects(prospectsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalculations();
  }, [fetchCalculations]);

  const handleAddToComparison = useCallback(
    (calculation: CalculationWithProperty) => {
      // Check if already in comparison
      if (comparisonCalculations.some((c) => c.id === calculation.id)) {
        showToast({
          message: t('investment-calculator:duplicateWarning'),
          severity: 'warning',
        });
        return;
      }

      // Check max limit
      if (comparisonCalculations.length >= MAX_CALCULATIONS) {
        showToast({
          message: t('investment-calculator:maxCalculationsWarning'),
          severity: 'warning',
        });
        return;
      }

      setComparisonCalculations((prev) => [...prev, calculation]);
    },
    [comparisonCalculations, showToast, t]
  );

  const handleRemoveFromComparison = useCallback((id: number) => {
    setComparisonCalculations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleUpdateCalculation = useCallback((updated: SavedInvestmentCalculation) => {
    setComparisonCalculations((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  }, []);

  const handleOpenAddDialog = useCallback((property: Property) => {
    setAddDialogProperty(property);
  }, []);

  const handleCloseAddDialog = useCallback(() => {
    setAddDialogProperty(null);
  }, []);

  const handleCalculationSaved = useCallback((calculation: SavedInvestmentCalculation) => {
    // Refresh the list
    fetchCalculations();

    // Auto-add to comparison if under limit, including property data for display
    if (comparisonCalculations.length < MAX_CALCULATIONS && addDialogProperty) {
      const calculationWithProperty: CalculationWithProperty = {
        ...calculation,
        property: addDialogProperty,
        propertyId: addDialogProperty.id,
      };
      setComparisonCalculations((prev) => [...prev, calculationWithProperty]);
    }

    handleCloseAddDialog();
  }, [fetchCalculations, comparisonCalculations.length, addDialogProperty, handleCloseAddDialog]);

  const handleDeleteClick = useCallback((id: number) => {
    setDeleteTargetId(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTargetId === null) return;

    try {
      await ApiClient.delete('real-estate/investment', deleteTargetId);
      // Remove from comparison if present
      setComparisonCalculations((prev) => prev.filter((c) => c.id !== deleteTargetId));
      // Refresh list
      fetchCalculations();
      showToast({ message: t('common:deleted'), severity: 'success' });
    } catch (err) {
      console.error('Failed to delete calculation:', err);
      showToast({ message: t('common:toast.error'), severity: 'error' });
    } finally {
      setDeleteTargetId(null);
    }
  }, [deleteTargetId, fetchCalculations, showToast, t]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTargetId(null);
  }, []);

  // Group calculations by property AND include all prospects
  const groupedByProperty = React.useMemo(() => {
    // Start with all prospects
    const propertyMap = new Map<number, { property: Property; calculations: CalculationWithProperty[] }>();

    // Add all prospects to the map
    prospects.forEach((property) => {
      propertyMap.set(property.id, { property, calculations: [] });
    });

    // Group calculations by property
    const unlinked: CalculationWithProperty[] = [];
    calculations.forEach((calc) => {
      if (calc.propertyId && propertyMap.has(calc.propertyId)) {
        propertyMap.get(calc.propertyId)!.calculations.push(calc);
      } else if (calc.propertyId && calc.property) {
        // Property exists but wasn't in prospects list (e.g., OWN status)
        propertyMap.set(calc.propertyId, { property: calc.property, calculations: [calc] });
      } else {
        unlinked.push(calc);
      }
    });

    return {
      properties: Array.from(propertyMap.values()),
      unlinked,
    };
  }, [calculations, prospects]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>{t('common:loading')}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          gap: 2,
        }}
      >
        <Typography color="error">{t('investment-calculator:errorLoading')}</Typography>
        <AssetButton label={t('common:retry')} onClick={fetchCalculations} />
      </Box>
    );
  }

  if (calculations.length === 0 && prospects.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          gap: 2,
        }}
      >
        <Typography variant="h6">{t('investment-calculator:noCalculations')}</Typography>
        <Typography color="text.secondary">
          {t('investment-calculator:noCalculationsMessage')}
        </Typography>
      </Box>
    );
  }

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: 'list' | 'compare' | null
  ) => {
    if (newView === 'list') {
      navigate('/app/portfolio/prospects');
    }
    // If compare is selected or null, stay on current page
  };

  return (
    <Box sx={{ p: standalone ? 2 : 0 }}>
      {/* Toolbar with toggle buttons - only shown in standalone mode */}
      {standalone && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h5">
            {t('investment-calculator:prospectCompare')}
          </Typography>
          <ToggleButtonGroup
            value="compare"
            exclusive
            onChange={handleViewChange}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="list" aria-label={t('property:listView')}>
              <ViewListIcon data-testid="ViewListIcon" sx={{ mr: { xs: 0, sm: 1 } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {t('property:listView')}
              </Box>
            </ToggleButton>
            <ToggleButton value="compare" aria-label={t('property:compareView')}>
              <CompareArrowsIcon data-testid="CompareArrowsIcon" sx={{ mr: { xs: 0, sm: 1 } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {t('property:compareView')}
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Left panel - Calculations list */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            data-testid="calculations-list-panel"
            sx={{ height: '100%', overflow: 'auto' }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">
                {t('investment-calculator:calculations')}
              </Typography>
            </Box>
            <Divider />
            <List>
              {/* Grouped by property */}
              {groupedByProperty.properties.map(({ property, calculations: calcs }) => (
                <React.Fragment key={property.id}>
                  <ListSubheader sx={{ backgroundColor: 'background.paper' }}>
                    {property.name || property.address?.street || `Property ${property.id}`}
                  </ListSubheader>
                  {calcs.map((calc) => (
                    <CalculationListItem
                      key={calc.id}
                      calculation={calc}
                      property={calc.property}
                      isSelected={comparisonCalculations.some((c) => c.id === calc.id)}
                      onClick={() => handleAddToComparison(calc)}
                      onDelete={() => handleDeleteClick(calc.id)}
                    />
                  ))}
                  <ListItemButton
                    sx={{ pl: 4 }}
                    onClick={() => handleOpenAddDialog(property)}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <AddIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('investment-calculator:addCalculation')}
                      primaryTypographyProps={{ color: 'primary', variant: 'body2' }}
                    />
                  </ListItemButton>
                </React.Fragment>
              ))}

              {/* Unlinked calculations */}
              {groupedByProperty.unlinked.length > 0 && (
                <>
                  <ListSubheader sx={{ backgroundColor: 'background.paper' }}>
                    {t('investment-calculator:unlinkedCalculations')}
                  </ListSubheader>
                  {groupedByProperty.unlinked.map((calc) => (
                    <CalculationListItem
                      key={calc.id}
                      calculation={calc}
                      isSelected={comparisonCalculations.some((c) => c.id === calc.id)}
                      onClick={() => handleAddToComparison(calc)}
                      onDelete={() => handleDeleteClick(calc.id)}
                    />
                  ))}
                </>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Right panel - Comparison area */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper data-testid="comparison-panel" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('investment-calculator:comparison')}
            </Typography>
            <ComparisonDropZone
              calculations={comparisonCalculations}
              onRemove={handleRemoveFromComparison}
              onUpdate={handleUpdateCalculation}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Add Calculation Dialog */}
      {addDialogProperty && (
        <InvestmentAddDialog
          open={!!addDialogProperty}
          property={addDialogProperty}
          onClose={handleCloseAddDialog}
          onSave={handleCalculationSaved}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AssetConfirmDialog
        open={deleteTargetId !== null}
        title={t('common:confirmDelete')}
        contentText={t('investment-calculator:deleteConfirm')}
        buttonTextCancel={t('common:cancel')}
        buttonTextConfirm={t('common:confirm')}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Box>
  );
}

export default ProspectCompareView;
