import { Box, Grid, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WithTranslation, withTranslation } from 'react-i18next';
import { propertyContext } from '../../lib/asset-contexts';
import { Property, PropertyStatus, propertyTypeNames, PropertyStatistics } from '@asset-types';
import ApiClient from '../../lib/api-client';
import AssetLoadingProgress from '../asset/AssetLoadingProgress';
import AssetButton from '../asset/form/AssetButton';
import { getPhotoUrl } from '@asset-lib/functions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PropertyReportSection from './report/PropertyReportSection';
import { AllocationRulesModal } from '../allocation';
import { getReturnPathForStatus } from './property-form-utils';
import PropertyStatusRibbon from './PropertyStatusRibbon';
import ProspectInvestmentSection from './sections/ProspectInvestmentSection';
import ExternalListingLink from './sections/ExternalListingLink';
import PropertyActionsMenu from './sections/PropertyActionsMenu';
import PropertyKpiSection from './sections/PropertyKpiSection';
import PropertyInfoSection from './sections/PropertyInfoSection';
import PropertyInfoCard from './shared/PropertyInfoCard';
import { calculateSummaryData } from './report/report-utils';

function PropertyView({ t }: WithTranslation) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [showAdvancedReports, setShowAdvancedReports] = useState(false);
  const [statistics, setStatistics] = useState<PropertyStatistics[]>([]);
  const { idParam } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperty = async () => {
      if (!idParam) {
        setError('Property ID not provided');
        setLoading(false);
        return;
      }

      try {
        const data = await ApiClient.get<Property>(
          propertyContext.apiPath,
          Number(idParam),
          { ownerships: true }
        );
        setProperty(data);

        // Fetch statistics for OWN/SOLD properties
        if (data && (data.status === PropertyStatus.OWN || data.status === PropertyStatus.SOLD)) {
          const statsData = await ApiClient.propertyStatistics<PropertyStatistics>(
            Number(idParam),
            { includeYearly: true }
          );
          setStatistics(statsData);
        }
      } catch (err) {
        setError('Failed to load property');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [idParam]);

  const summaryData = useMemo(
    () => calculateSummaryData(statistics, new Date().getFullYear()),
    [statistics]
  );

  const getRoutePrefix = () => {
    return property?.status === PropertyStatus.PROSPECT ? 'prospects' : 'own';
  };

  const handleEdit = () => {
    const prefix = getRoutePrefix();
    navigate(`${propertyContext.routePath}/${prefix}/edit/${idParam}`, {
      state: { returnTo: 'view' },
    });
  };

  const handleBack = () => {
    const status = property?.status ?? PropertyStatus.OWN;
    navigate(getReturnPathForStatus(status));
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <AssetLoadingProgress />
      </Paper>
    );
  }

  if (error || !property) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="error">{error || 'Property not found'}</Typography>
      </Paper>
    );
  }

  const imageUrl = getPhotoUrl(property.photo);
  const ownershipShare = property.ownerships?.[0]?.share ?? 100;

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      {/* Hero image with status ribbon - reduced height */}
      <Box sx={{ position: 'relative' }}>
        <Box
          component="img"
          src={imageUrl}
          alt={property.name}
          sx={{
            width: '100%',
            height: { xs: 150, sm: 180 },
            objectFit: 'cover',
          }}
        />
        <PropertyStatusRibbon status={property.status} ownershipShare={ownershipShare} />
      </Box>

      {/* Header: Back + Name + Menu */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <AssetButton
              label={t('back')}
              variant="text"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ ml: -1, mb: 0.5 }}
            />
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
              {property.name}
            </Typography>
            {(property.apartmentType || property.rooms) && (
              <Typography variant="body2" color="text.secondary">
                {[
                  property.apartmentType ? t(`propertyTypes.${propertyTypeNames.get(property.apartmentType)}`) : null,
                  property.rooms,
                ].filter(Boolean).join(' · ')}
              </Typography>
            )}
          </Box>
          <PropertyActionsMenu
            property={property}
            onEdit={handleEdit}
            onOpenAllocationRules={() => setRulesModalOpen(true)}
            onToggleAdvancedReports={() => setShowAdvancedReports((prev) => !prev)}
          />
        </Stack>
      </Box>

      {/* KPI Cards Section */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <PropertyKpiSection property={property} allTimeBalance={summaryData.allTimeBalance} />
      </Box>

      {/* Info Cards Grid */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <PropertyInfoSection property={property} />
      </Box>

      {/* Description Card */}
      {property.description && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Grid container>
            <Grid size={{ xs: 12 }}>
              <PropertyInfoCard title={t('description')}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {property.description}
                </Typography>
              </PropertyInfoCard>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Statistics - only for OWN */}
      {property.status === PropertyStatus.OWN && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: '0.75rem',
              fontWeight: 500,
              mb: 1.5,
            }}
          >
            {t('statisticsSection')}
          </Typography>
          <PropertyReportSection propertyId={property.id} showAdvancedReports={showAdvancedReports} statistics={statistics} />
        </Box>
      )}

      {/* External Listing Link - only for PROSPECT with external source */}
      {property.status === PropertyStatus.PROSPECT && property.externalSource && property.externalSourceId && (
        <ExternalListingLink
          externalSource={property.externalSource}
          externalSourceId={property.externalSourceId}
        />
      )}

      {/* Investment Calculator - only for PROSPECT */}
      {property.status === PropertyStatus.PROSPECT && (
        <ProspectInvestmentSection property={property} />
      )}

      {/* Statistics - for SOLD */}
      {property.status === PropertyStatus.SOLD && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: '0.75rem',
              fontWeight: 500,
              mb: 1.5,
            }}
          >
            {t('statisticsSection')}
          </Typography>
          <PropertyReportSection propertyId={property.id} showAdvancedReports={showAdvancedReports} statistics={statistics} />
        </Box>
      )}

      {/* Allocation Rules Modal */}
      <AllocationRulesModal
        open={rulesModalOpen}
        propertyId={property.id}
        propertyName={property.name}
        onClose={() => setRulesModalOpen(false)}
      />
    </Paper>
  );
}

export default withTranslation(propertyContext.name)(PropertyView);
