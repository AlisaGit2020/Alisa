import { Box, Chip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Property, PropertyExternalSource, PropertyExternalSourceName, propertyExternalSourceNames } from '@asset-types';

interface ProspectPropertyCardContentProps {
  property: Property;
}

/**
 * Card content for PROSPECT status properties.
 * Displays: asking price, price/m2, expected rent, gross yield, external source
 */
function ProspectPropertyCardContent({ property }: ProspectPropertyCardContentProps) {
  const { t } = useTranslation('property');

  const askingPrice = property.purchasePrice;
  const size = property.size;
  const monthlyRent = property.monthlyRent;
  const debtShare = property.debtShare;

  // Price per square meter
  const pricePerSqm = askingPrice && size && size > 0
    ? Math.round(askingPrice / size)
    : null;

  // Gross yield = (annual rent / purchase price) * 100
  const grossYield = askingPrice && askingPrice > 0 && monthlyRent
    ? ((monthlyRent * 12) / askingPrice) * 100
    : null;

  // External source display
  const externalSourceName = property.externalSource
    ? propertyExternalSourceNames.get(property.externalSource)
    : null;

  const getExternalSourceLabel = (source: PropertyExternalSource): string => {
    const name = propertyExternalSourceNames.get(source);
    if (name === PropertyExternalSourceName.ETUOVI) return 'Etuovi';
    if (name === PropertyExternalSourceName.OIKOTIE) return 'Oikotie';
    return '';
  };

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

  return (
    <Box sx={{ mt: 1 }}>
      {/* Asking Price */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('askingPrice')}
        </Typography>
        <Typography variant="body2">
          {askingPrice !== undefined ? formatCurrency(askingPrice) : '-'}
        </Typography>
      </Box>

      {/* Price per m2 - only show when we have size and no monthly rent (to avoid UI clutter when yield is shown) */}
      {pricePerSqm !== null && monthlyRent === undefined && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {t('pricePerSqm')}
          </Typography>
          <Typography variant="body2">
            {formatCurrency(pricePerSqm)}
          </Typography>
        </Box>
      )}

      {/* Expected Rent */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('expectedRent')}
        </Typography>
        <Typography variant="body2">
          {monthlyRent !== undefined ? formatCurrency(monthlyRent) : '-'}
        </Typography>
      </Box>

      {/* Gross Yield */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('grossYield')}
        </Typography>
        <Typography variant="body2">
          {grossYield !== null ? `${grossYield.toFixed(1)} %` : '-'}
        </Typography>
      </Box>

      {/* Debt Share - always show when defined, even if zero */}
      {debtShare !== undefined && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {t('debtShare')}
          </Typography>
          <Typography variant="body2">
            {formatCurrency(debtShare)}
          </Typography>
        </Box>
      )}

      {/* External Source */}
      {property.externalSource && externalSourceName && (
        <Box sx={{ mt: 1 }}>
          <Chip
            label={getExternalSourceLabel(property.externalSource)}
            size="small"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
}

export default ProspectPropertyCardContent;
