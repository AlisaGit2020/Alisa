import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PaymentsIcon from '@mui/icons-material/Payments';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Property } from '@asset-types';
import DetailRow from '../shared/DetailRow';
import { formatCurrency, formatDate } from '@asset-lib/format-utils';

interface SoldSummarySectionProps {
  property: Property;
}

function SoldSummarySection({ property }: SoldSummarySectionProps) {
  const { t } = useTranslation('property');

  const hasSaleData = property.salePrice !== undefined || property.saleDate !== undefined;

  // Calculate profit/loss if both purchase and sale prices exist
  const profitLoss =
    property.salePrice !== undefined &&
    property.salePrice !== null &&
    property.purchasePrice !== undefined &&
    property.purchasePrice !== null
      ? property.salePrice - property.purchasePrice
      : null;

  const isProfit = profitLoss !== null && profitLoss >= 0;

  if (!hasSaleData) {
    return null;
  }

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}
            >
              {t('saleInfoSection')}
            </Typography>
            {property.salePrice !== undefined && property.salePrice !== null && (
              <DetailRow
                icon={<PaymentsIcon fontSize="small" />}
                label={t('salePrice')}
                value={formatCurrency(property.salePrice)}
              />
            )}
            {property.saleDate !== undefined && property.saleDate !== null && (
              <DetailRow
                icon={<CalendarTodayIcon fontSize="small" />}
                label={t('saleDate')}
                value={formatDate(property.saleDate)}
              />
            )}
            {profitLoss !== null && (
              <DetailRow
                icon={isProfit ? <TrendingUpIcon fontSize="small" sx={{ color: 'success.main' }} /> : <TrendingDownIcon fontSize="small" sx={{ color: 'error.main' }} />}
                label={t('profitLoss')}
                value={
                  <Typography
                    component="span"
                    sx={{
                      color: isProfit ? 'success.main' : 'error.main',
                      fontWeight: 'bold',
                    }}
                  >
                    {isProfit ? '+' : ''}{formatCurrency(profitLoss)}
                  </Typography>
                }
              />
            )}
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

export default SoldSummarySection;
