import { Box, Typography, Stack, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AssetNumberField, AssetMoneyField } from '../asset';
import { TaxDeductionCalculation } from '../../types/entities';

interface TravelDeductionFormProps {
  calculation: TaxDeductionCalculation;
  distanceKm: number;
  ratePerKm: number;
  onDistanceChange: (value: number) => void;
  onRateChange: (value: number) => void;
}

function TravelDeductionForm({
  calculation,
  distanceKm,
  ratePerKm,
  onDistanceChange,
  onRateChange,
}: TravelDeductionFormProps) {
  const { t } = useTranslation('tax');

  const roundTrip = distanceKm * 2;
  const totalAmount = roundTrip * calculation.visits * ratePerKm;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('distanceFromHome')}
        </Typography>
        <AssetNumberField
          label=""
          value={distanceKm}
          onChange={(e) => onDistanceChange(parseFloat(e.target.value) || 0)}
          adornment="km"
          fullWidth
        />
      </Box>

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
          {t('ratePerKm')} ({calculation.year})
        </Typography>
        <AssetMoneyField
          label=""
          value={ratePerKm}
          onChange={(value) => onRateChange(value ?? 0)}
          adornment="€/km"
          fullWidth
        />
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('roundTripDistance')}
        </Typography>
        <Box sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography>
            {roundTrip.toFixed(1)} km
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({distanceKm} × 2)
            </Typography>
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('calculatedTotal')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {roundTrip.toFixed(1)} km × {calculation.visits} × {ratePerKm.toFixed(2)} €/km
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

export default TravelDeductionForm;
