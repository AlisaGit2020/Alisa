import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  List,
  ListSubheader,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import { AssetButton, useToast } from '../asset';
import ApiClient from '@asset-lib/api-client';
import { SavedInvestmentCalculation } from './InvestmentCalculatorResults';
import { Property } from '@asset-types';
import CalculationListItem from './CalculationListItem';
import ComparisonDropZone from './ComparisonDropZone';

interface CalculationWithProperty extends SavedInvestmentCalculation {
  property?: Property;
  propertyId?: number;
}

const MAX_CALCULATIONS = 5;

function ProspectCompareView() {
  const { t } = useTranslation(['investment-calculator', 'common']);
  const { showToast } = useToast();

  const [calculations, setCalculations] = useState<CalculationWithProperty[]>([]);
  const [comparisonCalculations, setComparisonCalculations] = useState<SavedInvestmentCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCalculations = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await ApiClient.search<CalculationWithProperty>('real-estate/investment', {
        relations: { property: true },
        order: { name: 'ASC' },
      });
      setCalculations(data);
    } catch (err) {
      console.error('Failed to fetch calculations:', err);
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

  // Group calculations by property
  const groupedCalculations = React.useMemo(() => {
    const groups: Record<string, CalculationWithProperty[]> = {};
    const unlinked: CalculationWithProperty[] = [];

    calculations.forEach((calc) => {
      if (calc.propertyId && calc.property) {
        const key = String(calc.propertyId);
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(calc);
      } else {
        unlinked.push(calc);
      }
    });

    return { groups, unlinked };
  }, [calculations]);

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

  if (calculations.length === 0) {
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

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        {t('investment-calculator:prospectCompare')}
      </Typography>

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
              {Object.entries(groupedCalculations.groups).map(([propertyId, calcs]) => {
                const property = calcs[0]?.property;
                return (
                  <React.Fragment key={propertyId}>
                    <ListSubheader sx={{ backgroundColor: 'background.paper' }}>
                      {property?.name || `Property ${propertyId}`}
                    </ListSubheader>
                    {calcs.map((calc) => (
                      <CalculationListItem
                        key={calc.id}
                        calculation={calc}
                        property={calc.property}
                        isSelected={comparisonCalculations.some((c) => c.id === calc.id)}
                        onClick={() => handleAddToComparison(calc)}
                      />
                    ))}
                  </React.Fragment>
                );
              })}

              {/* Unlinked calculations */}
              {groupedCalculations.unlinked.length > 0 && (
                <>
                  <ListSubheader sx={{ backgroundColor: 'background.paper' }}>
                    {t('investment-calculator:unlinkedCalculations')}
                  </ListSubheader>
                  {groupedCalculations.unlinked.map((calc) => (
                    <CalculationListItem
                      key={calc.id}
                      calculation={calc}
                      isSelected={comparisonCalculations.some((c) => c.id === calc.id)}
                      onClick={() => handleAddToComparison(calc)}
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
    </Box>
  );
}

export default ProspectCompareView;
