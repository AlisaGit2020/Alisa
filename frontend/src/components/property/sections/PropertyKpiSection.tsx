import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PaymentsIcon from '@mui/icons-material/Payments';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Property, PropertyStatus } from '@asset-types';
import { formatCurrency } from '@asset-lib/format-utils';
import PropertyKpiCard from '../shared/PropertyKpiCard';

interface PropertyKpiSectionProps {
  property: Property;
  allTimeBalance?: number;
}

function PropertyKpiSection({ property, allTimeBalance }: PropertyKpiSectionProps) {
  const { t } = useTranslation('property');

  const totalMonthlyCosts =
    (property.maintenanceFee ?? 0) +
    (property.waterCharge ?? 0) +
    (property.financialCharge ?? 0);

  const netRent = (property.monthlyRent ?? 0) - totalMonthlyCosts;

  const grossYield =
    property.purchasePrice && property.monthlyRent
      ? ((property.monthlyRent * 12) / property.purchasePrice) * 100
      : null;

  const profitLoss =
    property.salePrice !== undefined &&
    property.salePrice !== null &&
    property.purchasePrice !== undefined &&
    property.purchasePrice !== null
      ? property.salePrice - property.purchasePrice
      : null;

  const renderOwnKpis = () => (
    <>
      <Grid size={{ xs: 12, sm: 4 }}>
        <PropertyKpiCard
          icon={<PaymentsIcon fontSize="small" />}
          iconColor="primary.main"
          label={t('purchasePrice')}
          value={formatCurrency(property.purchasePrice ?? 0)}
          subtitle={property.debtShare ? `+ ${formatCurrency(property.debtShare)} ${t('debtShare').toLowerCase()}` : undefined}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <PropertyKpiCard
          icon={<AttachMoneyIcon fontSize="small" />}
          iconColor="success.main"
          label={t('monthlyRent')}
          value={`${formatCurrency(property.monthlyRent ?? 0)}${t('perMonth')}`}
          subtitle={totalMonthlyCosts > 0 ? `${t('netRent')}: ${formatCurrency(netRent)}${t('perMonth')}` : undefined}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <PropertyKpiCard
          icon={<AccountBalanceIcon fontSize="small" />}
          iconColor="secondary.main"
          label={t('report.allTimeBalance')}
          value={formatCurrency(allTimeBalance ?? 0)}
        />
      </Grid>
    </>
  );

  const sellingPrice =
    property.purchasePrice && property.debtShare
      ? property.purchasePrice - property.debtShare
      : null;

  const renderProspectKpis = () => (
    <>
      <Grid size={{ xs: 12, sm: 4 }}>
        <PropertyKpiCard
          icon={<PaymentsIcon fontSize="small" />}
          iconColor="primary.main"
          label={t('askingPrice')}
          value={formatCurrency(property.purchasePrice ?? 0)}
          subtitle={
            property.debtShare && sellingPrice !== null
              ? `${t('sellingPrice')}: ${formatCurrency(sellingPrice)} + ${t('debtShare')}: ${formatCurrency(property.debtShare)}`
              : t('noHousingCompanyLoan')
          }
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <PropertyKpiCard
          icon={<AttachMoneyIcon fontSize="small" />}
          iconColor="success.main"
          label={t('expectedRent')}
          value={`${formatCurrency(property.monthlyRent ?? 0)}${t('perMonth')}`}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <PropertyKpiCard
          icon={<TrendingUpIcon fontSize="small" />}
          iconColor="warning.main"
          label={t('grossYield')}
          value={grossYield !== null ? `${grossYield.toFixed(1)}%` : '-'}
        />
      </Grid>
    </>
  );

  const renderSoldKpis = () => {
    const isProfit = profitLoss !== null && profitLoss >= 0;
    return (
      <>
        <Grid size={{ xs: 12, sm: 4 }}>
          <PropertyKpiCard
            icon={<PaymentsIcon fontSize="small" />}
            iconColor="primary.main"
            label={t('purchasePrice')}
            value={formatCurrency(property.purchasePrice ?? 0)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <PropertyKpiCard
            icon={<AttachMoneyIcon fontSize="small" />}
            iconColor="success.main"
            label={t('salePrice')}
            value={formatCurrency(property.salePrice ?? 0)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <PropertyKpiCard
            icon={isProfit ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
            iconColor={isProfit ? 'success.main' : 'error.main'}
            label={t('profitLoss')}
            value={profitLoss !== null ? `${isProfit ? '+' : ''}${formatCurrency(profitLoss)}` : '-'}
            valueColor={profitLoss !== null ? (isProfit ? 'success.main' : 'error.main') : 'text.primary'}
          />
        </Grid>
      </>
    );
  };

  return (
    <Grid container spacing={2}>
      {property.status === PropertyStatus.OWN && renderOwnKpis()}
      {property.status === PropertyStatus.PROSPECT && renderProspectKpis()}
      {property.status === PropertyStatus.SOLD && renderSoldKpis()}
    </Grid>
  );
}

export default PropertyKpiSection;
