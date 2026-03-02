import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Property } from '@asset-types';

interface OwnPropertyCardContentProps {
  property: Property;
}

/**
 * Card content for OWN status properties.
 * Displays: monthly rent, net rent, ownership share
 */
function OwnPropertyCardContent({ property }: OwnPropertyCardContentProps) {
  const { t } = useTranslation('property');

  const monthlyRent = property.monthlyRent ?? 0;
  const maintenanceFee = property.maintenanceFee ?? 0;
  const financialCharge = property.financialCharge ?? 0;
  const waterCharge = property.waterCharge ?? 0;

  // Net rent = rent - all costs
  const netRent = monthlyRent - maintenanceFee - financialCharge - waterCharge;

  // Get ownership share from first ownership
  const ownershipShare = property.ownerships?.[0]?.share;

  const formatCurrency = (value: number): string => {
    const formatted = new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
    // Replace Unicode minus (U+2212) with regular hyphen-minus for consistent display
    return formatted.replace(/\u2212/g, '-');
  };

  // Check if any costs are present (to determine whether to show net rent)
  const hasCosts = maintenanceFee > 0 || financialCharge > 0 || waterCharge > 0;

  return (
    <Box sx={{ mt: 1 }}>
      {/* Monthly Rent */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('monthlyRent')}
        </Typography>
        <Typography variant="body2">
          {formatCurrency(monthlyRent)}
        </Typography>
      </Box>

      {/* Net Rent - only show if there are costs (otherwise net = gross) */}
      {hasCosts && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {t('netRent')}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: netRent >= 0 ? 'success.main' : 'error.main',
            }}
          >
            {formatCurrency(netRent)}
          </Typography>
        </Box>
      )}

      {/* Ownership Share */}
      {ownershipShare !== undefined && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {t('ownershipShare')}
          </Typography>
          <Typography variant="body2">
            {ownershipShare} %
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default OwnPropertyCardContent;
