import { Box, Typography, Stack, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AssetMoneyField, AssetNumberField } from '../asset';
import type { TaxDeductionCalculation } from '../../types/entities';
interface LaundryDeductionFormProps {
  calculation: TaxDeductionCalculation;
  visits: number;
  pricePerLaundry: number;
  onVisitsChange: (value: number) => void;
  onPriceChange: (value: number) => void;
}

function LaundryDeductionForm({
  calculation,
  visits,
  pricePerLaundry,
  onVisitsChange,
  onPriceChange,
}: LaundryDeductionFormProps) {
  const { t } = useTranslation('tax');

  const totalAmount = visits * pricePerLaundry;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('visits')}
          {calculation.visits > 0 && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({t('visitsFromStatistics')}: {calculation.visits})
            </Typography>
          )}
        </Typography>
        <AssetNumberField
          label=""
          value={visits}
          onChange={(e) => onVisitsChange(parseInt(e.target.value) || 0)}
          fullWidth
        />
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('pricePerLaundry')}
        </Typography>
        <AssetMoneyField
          label=""
          value={pricePerLaundry}
          onChange={(value) => onPriceChange(value ?? 0)}
          fullWidth
        />
      </Box>

      <Divider />

      <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('calculatedTotal')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {visits} × {pricePerLaundry.toFixed(2)} €
            </Typography>
          </Box>
          <Typography variant="h4" color="success.dark" fontWeight="bold">
            {totalAmount.toFixed(2)} €
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}

export default LaundryDeductionForm;
