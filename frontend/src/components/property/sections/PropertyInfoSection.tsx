import { Grid, IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CalculateIcon from '@mui/icons-material/Calculate';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MapIcon from '@mui/icons-material/Map';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HistoryIcon from '@mui/icons-material/History';
import { Property, PropertyStatus, CurrentCharges } from '@asset-types';
import { formatCurrency, formatDate } from '@asset-lib/format-utils';
import ApiClient from '@asset-lib/api-client';
import PropertyInfoCard from '../shared/PropertyInfoCard';
import DetailRow from '../shared/DetailRow';
import PropertyChargeDialog from './PropertyChargeDialog';

interface PropertyInfoSectionProps {
  property: Property;
}

function PropertyInfoSection({ property }: PropertyInfoSectionProps) {
  const { t } = useTranslation('property');
  const [currentCharges, setCurrentCharges] = useState<CurrentCharges | null>(null);
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCharges = async () => {
      try {
        const charges = await ApiClient.request<CurrentCharges>({
          method: 'GET',
          url: `/real-estate/property/${property.id}/charges/current`,
        });
        setCurrentCharges(charges);
      } catch {
        // Silently fail - charges will show as empty
      }
    };
    fetchCharges();
  }, [property.id]);

  const handleChargesUpdated = () => {
    // Refetch charges
    ApiClient.request<CurrentCharges>({
      method: 'GET',
      url: `/real-estate/property/${property.id}/charges/current`,
    }).then(setCurrentCharges);
  };

  const hasAddress = property.address?.street || property.address?.city;
  const hasCosts =
    currentCharges !== null &&
    (currentCharges.maintenanceFee !== null ||
      currentCharges.waterPrepayment !== null ||
      currentCharges.financialCharge !== null);
  const hasPurchaseDetails =
    (property.status === PropertyStatus.OWN || property.status === PropertyStatus.SOLD) &&
    (property.purchaseDate !== undefined || property.purchaseLoan !== undefined);
  const hasSaleDetails =
    property.status === PropertyStatus.SOLD &&
    property.saleDate !== undefined &&
    property.saleDate !== null;

  const totalMonthlyCosts =
    (currentCharges?.maintenanceFee ?? 0) +
    (currentCharges?.waterPrepayment ?? 0) +
    (currentCharges?.financialCharge ?? 0);

  const pricePerSqm =
    property.purchasePrice && property.size > 0
      ? Math.round(property.purchasePrice / property.size)
      : null;

  return (
    <Grid container spacing={2}>
      {/* Property Info Card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <PropertyInfoCard title={t('propertyInfo')}>
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
          {pricePerSqm && (
            <DetailRow
              icon={<CalculateIcon fontSize="small" />}
              label={t('pricePerSqm')}
              value={formatCurrency(pricePerSqm)}
            />
          )}
        </PropertyInfoCard>
      </Grid>

      {/* Location Card */}
      {hasAddress && (
        <Grid size={{ xs: 12, md: 6 }}>
          <PropertyInfoCard title={t('locationInfo')}>
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
            {property.address?.district && (
              <DetailRow
                icon={<MapIcon fontSize="small" />}
                label={t('district')}
                value={property.address.district}
              />
            )}
          </PropertyInfoCard>
        </Grid>
      )}

      {/* Monthly Costs Card */}
      {hasCosts && (
        <Grid size={{ xs: 12, md: 6 }}>
          <PropertyInfoCard
            title={t('monthlyCostsSection')}
            action={
              <Tooltip title={t('chargeHistory')}>
                <IconButton
                  size="small"
                  onClick={() => setChargeDialogOpen(true)}
                  aria-label={t('chargeHistory')}
                >
                  <HistoryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          >
            {currentCharges?.maintenanceFee !== null && currentCharges?.maintenanceFee !== undefined && (
              <DetailRow
                icon={<HomeWorkIcon fontSize="small" />}
                label={t('maintenanceFee')}
                value={`${formatCurrency(currentCharges.maintenanceFee, 2)}${t('perMonth')}`}
              />
            )}
            {currentCharges?.waterPrepayment !== null && currentCharges?.waterPrepayment !== undefined && (
              <DetailRow
                icon={<WaterDropIcon fontSize="small" />}
                label={t('waterPrepayment')}
                value={`${formatCurrency(currentCharges.waterPrepayment, 2)}${t('perMonth')}`}
              />
            )}
            {currentCharges?.financialCharge !== null && currentCharges?.financialCharge !== undefined && (
              <DetailRow
                icon={<AccountBalanceIcon fontSize="small" />}
                label={t('financialCharge')}
                value={`${formatCurrency(currentCharges.financialCharge, 2)}${t('perMonth')}`}
              />
            )}
            {totalMonthlyCosts > 0 && (
              <DetailRow
                icon={<CalculateIcon fontSize="small" />}
                label={t('totalMonthlyCosts')}
                value={`${formatCurrency(totalMonthlyCosts, 2)}${t('perMonth')}`}
              />
            )}
          </PropertyInfoCard>
        </Grid>
      )}

      {/* Purchase Details Card */}
      {hasPurchaseDetails && (
        <Grid size={{ xs: 12, md: 6 }}>
          <PropertyInfoCard title={t('purchaseInfoSection')}>
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
          </PropertyInfoCard>
        </Grid>
      )}

      {/* Sale Details Card - only for SOLD */}
      {hasSaleDetails && (
        <Grid size={{ xs: 12, md: 6 }}>
          <PropertyInfoCard title={t('saleInfoSection')}>
            <DetailRow
              icon={<CalendarTodayIcon fontSize="small" />}
              label={t('saleDate')}
              value={formatDate(property.saleDate!)}
            />
          </PropertyInfoCard>
        </Grid>
      )}

      {/* Charge History Dialog */}
      <PropertyChargeDialog
        open={chargeDialogOpen}
        propertyId={property.id}
        onClose={() => setChargeDialogOpen(false)}
        onChargesUpdated={handleChargesUpdated}
      />
    </Grid>
  );
}

export default PropertyInfoSection;
