import { Box, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WithTranslation, withTranslation } from 'react-i18next';
import { propertyContext } from '../../lib/asset-contexts';
import { Property, PropertyStatus, propertyTypeNames } from '@asset-types';
import ApiClient from '../../lib/api-client';
import AssetLoadingProgress from '../asset/AssetLoadingProgress';
import AssetButton from '../asset/form/AssetButton';
import { getPhotoUrl } from '@asset-lib/functions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PaymentsIcon from '@mui/icons-material/Payments';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PropertyReportSection from './report/PropertyReportSection';
import { AllocationRulesModal } from '../allocation';
import { getReturnPathForStatus } from './property-form-utils';
import PropertyStatusRibbon from './PropertyStatusRibbon';
import ProspectInvestmentSection from './sections/ProspectInvestmentSection';
import PropertyActionsMenu from './sections/PropertyActionsMenu';
import SoldSummarySection from './sections/SoldSummarySection';

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 2, minWidth: 24 }}>
        {icon}
      </Box>
      <Typography sx={{ color: 'text.secondary', minWidth: 150 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fi-FI');
};

function PropertyView({ t }: WithTranslation) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [showAdvancedReports, setShowAdvancedReports] = useState(false);
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
      } catch (err) {
        setError('Failed to load property');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [idParam]);

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
      {/* Hero image with status ribbon overlay */}
      <Box sx={{ position: 'relative' }}>
        <Box
          component="img"
          src={imageUrl}
          alt={property.name}
          sx={{
            width: '100%',
            height: { xs: 200, sm: 250, md: 300 },
            objectFit: 'cover',
          }}
        />
        {/* Status ribbon in top-left corner */}
        <PropertyStatusRibbon status={property.status} ownershipShare={ownershipShare} />
      </Box>

      {/* Back button */}
      <Box sx={{ p: 2, pb: 0 }}>
        <AssetButton
          label={t('back')}
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        />
      </Box>

      {/* Header with name, subtitle and actions menu */}
      <Box sx={{ p: 2, pt: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h5" component="h1" gutterBottom>
              {property.name}
            </Typography>
            {(property.apartmentType || property.rooms) && (
              <Typography variant="body1" color="text.secondary">
                {[
                  property.apartmentType ? t(`propertyTypes.${propertyTypeNames.get(property.apartmentType)}`) : null,
                  property.rooms,
                ].filter(Boolean).join(' - ')}
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

      <Divider />

      {/* Property Information and Location - side by side on larger screens */}
      <Box sx={{ p: 2 }}>
        <Grid container spacing={4}>
          {/* Property Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
              {t('propertyInfo')}
            </Typography>
            <DetailRow
              icon={<SquareFootIcon fontSize="small" />}
              label={t('size')}
              value={`${property.size} m²`}
            />
            {property.buildYear && (
              <DetailRow
                icon={<CalendarTodayIcon fontSize="small" />}
                label={t('buildYear')}
                value={property.buildYear}
              />
            )}
          </Grid>

          {/* Location */}
          {(property.address?.street || property.address?.city) && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
                {t('locationInfo')}
              </Typography>
              {property.address?.street && (
                <DetailRow
                  icon={<LocationOnIcon fontSize="small" />}
                  label={t('address')}
                  value={property.address.street}
                />
              )}
              {property.address?.city && (
                <DetailRow
                  icon={<LocationCityIcon fontSize="small" />}
                  label={t('city')}
                  value={`${property.address.postalCode ? property.address.postalCode + ' ' : ''}${property.address.city}`}
                />
              )}
            </Grid>
          )}
        </Grid>
      </Box>

      <Divider />

      {/* Description */}
      {property.description && (
        <>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
              {t('description')}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {property.description}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Monthly Costs Section - all statuses */}
      {(property.maintenanceFee !== undefined ||
        property.waterCharge !== undefined ||
        property.financialCharge !== undefined ||
        (property.status === PropertyStatus.OWN && property.monthlyRent !== undefined)) && (
        <>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
                  {t('monthlyCostsSection')}
                </Typography>
                {property.maintenanceFee !== undefined && property.maintenanceFee !== null && (
                  <DetailRow
                    icon={<HomeWorkIcon fontSize="small" />}
                    label={t('maintenanceFee')}
                    value={`${formatCurrency(property.maintenanceFee)}/kk`}
                  />
                )}
                {property.waterCharge !== undefined && property.waterCharge !== null && (
                  <DetailRow
                    icon={<WaterDropIcon fontSize="small" />}
                    label={t('waterCharge')}
                    value={`${formatCurrency(property.waterCharge)}/kk`}
                  />
                )}
                {property.financialCharge !== undefined && property.financialCharge !== null && (
                  <DetailRow
                    icon={<AccountBalanceIcon fontSize="small" />}
                    label={t('financialCharge')}
                    value={`${formatCurrency(property.financialCharge)}/kk`}
                  />
                )}
                {property.status === PropertyStatus.OWN && property.monthlyRent !== undefined && property.monthlyRent !== null && (
                  <DetailRow
                    icon={<AttachMoneyIcon fontSize="small" />}
                    label={t('monthlyRent')}
                    value={`${formatCurrency(property.monthlyRent)}/kk`}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
          <Divider />
        </>
      )}

      {/* Price Info Section - PROSPECT only (Asking Price + Debt Share) */}
      {property.status === PropertyStatus.PROSPECT &&
        (property.purchasePrice !== undefined || property.debtShare !== undefined) && (
        <>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
                  {t('purchaseInfoSection')}
                </Typography>
                {property.purchasePrice !== undefined && property.purchasePrice !== null && (
                  <DetailRow
                    icon={<PaymentsIcon fontSize="small" />}
                    label={t('askingPrice')}
                    value={formatCurrency(property.purchasePrice)}
                  />
                )}
                {property.debtShare !== undefined && property.debtShare !== null && (
                  <DetailRow
                    icon={<AccountBalanceIcon fontSize="small" />}
                    label={t('debtShare')}
                    value={formatCurrency(property.debtShare)}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
          <Divider />
        </>
      )}

      {/* Purchase Info Section - OWN only (Purchase Price + Debt Share + Date + Loan) */}
      {property.status === PropertyStatus.OWN &&
        (property.purchasePrice !== undefined ||
          property.debtShare !== undefined ||
          property.purchaseDate !== undefined ||
          property.purchaseLoan !== undefined) && (
        <>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
                  {t('purchaseInfoSection')}
                </Typography>
                {property.purchasePrice !== undefined && property.purchasePrice !== null && (
                  <DetailRow
                    icon={<PaymentsIcon fontSize="small" />}
                    label={t('purchasePrice')}
                    value={formatCurrency(property.purchasePrice)}
                  />
                )}
                {property.debtShare !== undefined && property.debtShare !== null && (
                  <DetailRow
                    icon={<AccountBalanceIcon fontSize="small" />}
                    label={t('debtShare')}
                    value={formatCurrency(property.debtShare)}
                  />
                )}
                {property.purchaseDate !== undefined && property.purchaseDate !== null && (
                  <DetailRow
                    icon={<CalendarTodayIcon fontSize="small" />}
                    label={t('purchaseDate')}
                    value={formatDate(property.purchaseDate)}
                  />
                )}
                {property.purchaseLoan !== undefined && property.purchaseLoan !== null && (
                  <DetailRow
                    icon={<AccountBalanceIcon fontSize="small" />}
                    label={t('purchaseLoan')}
                    value={formatCurrency(property.purchaseLoan)}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
          <Divider />
        </>
      )}

      {/* Purchase Info Section - SOLD only (Purchase Price + Date + Loan, NO Debt Share) */}
      {property.status === PropertyStatus.SOLD &&
        (property.purchasePrice !== undefined ||
          property.purchaseDate !== undefined ||
          property.purchaseLoan !== undefined) && (
        <>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
                  {t('purchaseInfoSection')}
                </Typography>
                {property.purchasePrice !== undefined && property.purchasePrice !== null && (
                  <DetailRow
                    icon={<PaymentsIcon fontSize="small" />}
                    label={t('purchasePrice')}
                    value={formatCurrency(property.purchasePrice)}
                  />
                )}
                {property.purchaseDate !== undefined && property.purchaseDate !== null && (
                  <DetailRow
                    icon={<CalendarTodayIcon fontSize="small" />}
                    label={t('purchaseDate')}
                    value={formatDate(property.purchaseDate)}
                  />
                )}
                {property.purchaseLoan !== undefined && property.purchaseLoan !== null && (
                  <DetailRow
                    icon={<AccountBalanceIcon fontSize="small" />}
                    label={t('purchaseLoan')}
                    value={formatCurrency(property.purchaseLoan)}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
          <Divider />
        </>
      )}

      {/* Statistics - only for OWN */}
      {property.status === PropertyStatus.OWN && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
            {t('statisticsSection')}
          </Typography>
          <PropertyReportSection propertyId={property.id} showAdvancedReports={showAdvancedReports} />
        </Box>
      )}

      {/* Investment Calculator - only for PROSPECT */}
      {property.status === PropertyStatus.PROSPECT && (
        <ProspectInvestmentSection property={property} />
      )}

      {/* Sale Summary - only for SOLD */}
      {property.status === PropertyStatus.SOLD && (
        <SoldSummarySection property={property} />
      )}

      {/* Statistics - for SOLD (at the bottom) */}
      {property.status === PropertyStatus.SOLD && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
            {t('statisticsSection')}
          </Typography>
          <PropertyReportSection propertyId={property.id} showAdvancedReports={showAdvancedReports} />
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
