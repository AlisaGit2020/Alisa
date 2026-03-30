import { Box, Typography, Stack, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AssetMoneyField } from '../asset';
import { TaxDeductionCalculation } from '../../types/entities';

interface LaundryDeductionFormProps {
  calculation: TaxDeductionCalculation;
  pricePerLaundry: number;
  onPriceChange: (value: number) => void;
}

function LaundryDeductionForm({
  calculation,
  pricePerLaundry,
  onPriceChange,
}: LaundryDeductionFormProps) {
  const { t } = useTranslation('tax');

  const totalAmount = calculation.visits * pricePerLaundry;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('visits')}
        </Typography>
        <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="h6">
            {calculation.visits}
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({t('visitsFromStatistics')})
            </Typography>
          </Typography>
        </Box>
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
              {calculation.visits} × {pricePerLaundry.toFixed(2)} €
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
