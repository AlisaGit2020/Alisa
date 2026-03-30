import { Box, Typography, Stack, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AssetNumberField, AssetMoneyField } from '../asset';
import { TaxDeductionCalculation } from '../../types/entities';

interface TravelDeductionFormProps {
  calculation: TaxDeductionCalculation;
  distanceKm: number;
  visits: number;
  ratePerKm: number;
  onDistanceChange: (value: number) => void;
  onVisitsChange: (value: number) => void;
  onRateChange: (value: number) => void;
}

function TravelDeductionForm({
  calculation,
  distanceKm,
  visits,
  ratePerKm,
  onDistanceChange,
  onVisitsChange,
  onRateChange,
}: TravelDeductionFormProps) {
  const { t } = useTranslation('tax');

  const roundTrip = distanceKm * 2;
  const totalAmount = roundTrip * visits * ratePerKm;

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
              {roundTrip.toFixed(1)} km × {visits} × {ratePerKm.toFixed(2)} €/km
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
