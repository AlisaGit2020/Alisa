import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListSubheader,
  CircularProgress,
  Divider,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { AssetButton, useToast } from '../asset';
import ApiClient from '@asset-lib/api-client';
import { SavedInvestmentCalculation } from './InvestmentCalculatorResults';
import { Property } from '@asset-types';
import { PropertyStatus } from '@asset-types/common';
import CalculationListItem from './CalculationListItem';
import ComparisonDropZone from './ComparisonDropZone';

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
  // TODO: prospects will be used in Task 4 to display all prospects grouped with calculations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [prospects, setProspects] = useState<Property[]>([]);
  const [comparisonCalculations, setComparisonCalculations] = useState<SavedInvestmentCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCalculations = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [calculationsData, prospectsData] = await Promise.all([
        ApiClient.search<CalculationWithProperty>('real-estate/investment', {
          relations: { property: { address: true } },
          order: { name: 'ASC' },
        }),
        ApiClient.search<Property>('real-estate/property/search', {
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
