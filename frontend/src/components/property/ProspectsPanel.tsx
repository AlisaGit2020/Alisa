import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  CircularProgress,
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AddIcon from '@mui/icons-material/Add';
import { Property } from '@asset-types';
import { PropertyStatus } from '@asset-types/common';
import ApiClient from '@asset-lib/api-client';
import { propertyContext } from '@asset-lib/asset-contexts';
import AssetCardList from '../asset/AssetCardList';
import { PROPERTY_LIST_CHANGE_EVENT } from '../layout/PropertyBadge';
import ProspectCompareView from '../investment-calculator/ProspectCompareView';
import { AssetButton, AssetAlert } from '../asset';

const VIEW_LIST = 'list';
const VIEW_COMPARE = 'compare';

type ViewMode = typeof VIEW_LIST | typeof VIEW_COMPARE;

interface ProspectsPanelProps {
  onAddClick?: () => void;
  refreshKey?: number;
}

function ProspectsPanel({ onAddClick, refreshKey = 0 }: ProspectsPanelProps) {
  const { t } = useTranslation(['property', 'investment-calculator', 'common']);
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get view mode from URL params
  const getViewFromParam = useCallback((): ViewMode => {
    const viewParam = searchParams.get('view');
    if (viewParam === VIEW_COMPARE) return VIEW_COMPARE;
    return VIEW_LIST;
  }, [searchParams]);

  const [view, setView] = useState<ViewMode>(getViewFromParam());

  // Sync view with URL params on mount and URL changes
  useEffect(() => {
    setView(getViewFromParam());
  }, [getViewFromParam]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await ApiClient.search<Property>('real-estate/property', {
        order: { name: 'ASC' as const },
        relations: { ownerships: true },
        where: { status: PropertyStatus.PROSPECT },
      });
      setProperties(data);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties, refreshKey]);

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: ViewMode | null
  ) => {
    if (newView !== null) {
      setView(newView);
      // Update URL params
      if (newView === VIEW_COMPARE) {
        setSearchParams({ view: VIEW_COMPARE });
      } else {
        setSearchParams({});
      }
    }
  };

  const handleAfterDelete = () => {
    window.dispatchEvent(new CustomEvent(PROPERTY_LIST_CHANGE_EVENT));
    fetchProperties();
  };

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
    }
  };

  if (loading && properties.length === 0) {
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

  return (
    <Box>
      {/* Toolbar with view toggle */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {view === VIEW_LIST && (
            <AssetButton
              label={t('property:add')}
              startIcon={<AddIcon />}
              onClick={handleAddClick}
            />
          )}
        </Box>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleViewChange}
          aria-label="view mode"
          size="small"
        >
          <ToggleButton value={VIEW_LIST} aria-label={t('property:listView')}>
            <ViewListIcon data-testid="ViewListIcon" sx={{ mr: { xs: 0, sm: 1 } }} />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {t('property:listView')}
            </Box>
          </ToggleButton>
          <ToggleButton value={VIEW_COMPARE} aria-label={t('property:compareView')}>
            <CompareArrowsIcon data-testid="CompareArrowsIcon" sx={{ mr: { xs: 0, sm: 1 } }} />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {t('property:compareView')}
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Content based on view mode */}
      {view === VIEW_LIST && (
        <>
          {error ? (
            <Box sx={{ mb: 2 }}>
              <AssetAlert severity="error" content={t('common:toast.loadFailed')} />
            </Box>
          ) : properties.length === 0 && !loading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200,
                gap: 2,
              }}
            >
              <Typography color="text.secondary">
                {t('property:noProspects')}
              </Typography>
            </Box>
          ) : (
            <Grid container>
              <Grid size={{ xs: 12, lg: 12 }}>
                <AssetCardList<Property>
                  key={refreshKey}
                  t={t}
                  assetContext={propertyContext}
                  fields={[{ name: 'name' }, { name: 'size', format: 'number' }]}
                  fetchOptions={{
                    order: { name: 'ASC' as const },
                    relations: { ownerships: true },
                    where: { status: PropertyStatus.PROSPECT },
                  }}
                  onAfterDelete={handleAfterDelete}
                  routePrefix="prospects"
                  onAddClick={handleAddClick}
                  hideAddLink={true}
                />
              </Grid>
            </Grid>
          )}
        </>
      )}

      {view === VIEW_COMPARE && <ProspectCompareView />}
    </Box>
  );
}

export default ProspectsPanel;
