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
      {/* Size */}
      {property.size !== undefined && property.size > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {t('size')}
          </Typography>
          <Typography variant="body2">
            {property.size} m²
          </Typography>
        </Box>
      )}

      {/* Build Year */}
      {property.buildYear && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {t('buildYear')}
          </Typography>
          <Typography variant="body2">
            {property.buildYear}
          </Typography>
        </Box>
      )}

      {/* Monthly Rent */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('monthlyRent')}
        </Typography>
        <Typography variant="body2">
          {formatCurrency(monthlyRent)}
        </Typography>
      </Box>

    </Box>
  );
}

export default OwnPropertyCardContent;
