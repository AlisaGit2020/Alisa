import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PaymentsIcon from '@mui/icons-material/Payments';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Property } from '@asset-types';
import { ReactNode } from 'react';

interface SoldSummarySectionProps {
  property: Property;
}

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
