import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Property } from '@asset-types';

interface SoldPropertyCardContentProps {
  property: Property;
}

/**
 * Card content for SOLD status properties.
 * Displays: purchase price, sale price, profit/loss, sale date
 */
function SoldPropertyCardContent({ property }: SoldPropertyCardContentProps) {
  const { t } = useTranslation('property');

  const purchasePrice = property.purchasePrice;
  const salePrice = property.salePrice;
  const saleDate = property.saleDate;

  // Calculate profit/loss
  const profitLoss = purchasePrice !== undefined && salePrice !== undefined
    ? salePrice - purchasePrice
    : null;

  // Calculate profit as percentage for display (profit / purchase price * 100)
  const profitPercent = profitLoss !== null && purchasePrice && purchasePrice > 0
    ? (profitLoss / purchasePrice) * 100
    : null;

  /**
   * Detects visual collision between profit and date displays.
   *
   * Edge case: When the sale date day (e.g., "15") matches the leading digits
   * of the profit (e.g., "15,000 €"), users may confuse them at a glance.
   *
   * Example collision:
   *   Profit/Loss:  15 000 €
   *   Sale Date:    15.03.2024
   *
   * When collision detected, we show profit as percentage instead:
   *   Profit/Loss:  +12.5%
   *   Sale Date:    15.03.2024
   */
  const hasDisplayCollision = (): boolean => {
    if (!saleDate || profitLoss === null) return false;
    const day = new Date(saleDate).getDate().toString();
    const profitStr = Math.abs(profitLoss).toString();
    return profitStr.startsWith(day);
  };

  const showProfitAsPercent = hasDisplayCollision();

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

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fi-FI', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Box sx={{ mt: 1 }}>
      {/* Purchase Price */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('purchasePrice')}
        </Typography>
        <Typography variant="body2">
          {purchasePrice !== undefined ? formatCurrency(purchasePrice) : '-'}
        </Typography>
      </Box>

      {/* Sale Price */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('salePrice')}
        </Typography>
        <Typography variant="body2">
          {salePrice !== undefined ? formatCurrency(salePrice) : '-'}
        </Typography>
      </Box>

      {/* Profit/Loss */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('profitLoss')}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: profitLoss !== null
              ? profitLoss >= 0 ? 'success.main' : 'error.main'
              : 'text.secondary',
          }}
        >
          {profitLoss !== null
            ? (showProfitAsPercent && profitPercent !== null
                ? `${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(1)}%`
                : formatCurrency(profitLoss))
            : '-'}
        </Typography>
      </Box>

      {/* Sale Date */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('saleDate')}
        </Typography>
        <Typography variant="body2">
          {formatDate(saleDate)}
        </Typography>
      </Box>
    </Box>
  );
}

export default SoldPropertyCardContent;
