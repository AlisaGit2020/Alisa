import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CalculateIcon from '@mui/icons-material/Calculate';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { Property, PropertyStatus } from '@asset-types';
import { formatCurrency, formatDate } from '@asset-lib/format-utils';
import PropertyInfoCard from '../shared/PropertyInfoCard';
import DetailRow from '../shared/DetailRow';

interface PropertyInfoSectionProps {
  property: Property;
}

function PropertyInfoSection({ property }: PropertyInfoSectionProps) {
  const { t } = useTranslation('property');

  const hasAddress = property.address?.street || property.address?.city;
  const hasCosts =
    property.maintenanceFee !== undefined ||
    property.waterCharge !== undefined ||
    property.financialCharge !== undefined;
  const hasPurchaseDetails =
    (property.status === PropertyStatus.OWN || property.status === PropertyStatus.SOLD) &&
    (property.purchaseDate !== undefined || property.purchaseLoan !== undefined);
  const hasSaleDetails =
    property.status === PropertyStatus.SOLD &&
    property.saleDate !== undefined &&
    property.saleDate !== null;

  const totalMonthlyCosts =
    (property.maintenanceFee ?? 0) +
    (property.waterCharge ?? 0) +
    (property.financialCharge ?? 0);

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
          </PropertyInfoCard>
        </Grid>
      )}

      {/* Monthly Costs Card */}
      {hasCosts && (
        <Grid size={{ xs: 12, md: 6 }}>
          <PropertyInfoCard title={t('monthlyCostsSection')}>
            {property.maintenanceFee !== undefined && property.maintenanceFee !== null && (
              <DetailRow
                icon={<HomeWorkIcon fontSize="small" />}
                label={t('maintenanceFee')}
                value={`${formatCurrency(property.maintenanceFee)}${t('perMonth')}`}
              />
            )}
            {property.waterCharge !== undefined && property.waterCharge !== null && (
              <DetailRow
                icon={<WaterDropIcon fontSize="small" />}
                label={t('waterCharge')}
                value={`${formatCurrency(property.waterCharge)}${t('perMonth')}`}
              />
            )}
            {property.financialCharge !== undefined && property.financialCharge !== null && (
              <DetailRow
                icon={<AccountBalanceIcon fontSize="small" />}
                label={t('financialCharge')}
                value={`${formatCurrency(property.financialCharge)}${t('perMonth')}`}
              />
            )}
            {totalMonthlyCosts > 0 && (
              <DetailRow
                icon={<CalculateIcon fontSize="small" />}
                label={t('totalMonthlyCosts')}
                value={`${formatCurrency(totalMonthlyCosts)}${t('perMonth')}`}
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
    </Grid>
  );
}

export default PropertyInfoSection;
