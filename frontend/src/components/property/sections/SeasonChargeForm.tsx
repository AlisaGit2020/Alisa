import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import { ChargeType, PropertyChargeInput } from '@asset-types';
import { formatCurrency } from '@asset-lib/format-utils';
import AssetMoneyField from '../../asset/form/AssetMoneyField';
import AssetDatePicker from '../../asset/form/AssetDatePicker';
import AssetButton from '../../asset/form/AssetButton';

interface SeasonChargeFormProps {
  propertyId: number;
  initialValues?: {
    maintenanceFee?: number;
    financialCharge?: number;
    waterPrepayment?: number;
    otherChargeBased?: number;
    startDate?: string;
    endDate?: string | null;
  };
  onSubmit: (charges: PropertyChargeInput[]) => void;
  onCancel: () => void;
}

function SeasonChargeForm({ propertyId, initialValues, onSubmit, onCancel }: SeasonChargeFormProps) {
  const { t } = useTranslation('property');

  // State for dates
  const [startDate, setStartDate] = useState<Date | null>(
    initialValues?.startDate ? dayjs(initialValues.startDate).toDate() : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialValues?.endDate ? dayjs(initialValues.endDate).toDate() : null
  );

  // State for charge amounts as a single object
  const [charges, setCharges] = useState({
    maintenanceFee: initialValues?.maintenanceFee ?? 0,
    financialCharge: initialValues?.financialCharge ?? 0,
    waterPrepayment: initialValues?.waterPrepayment ?? 0,
    otherChargeBased: initialValues?.otherChargeBased ?? 0,
  });

  // Charge field definitions for rendering and submission
  const chargeFields = [
    { key: 'maintenanceFee' as const, labelKey: 'chargeTypes.maintenance-fee', chargeType: ChargeType.MAINTENANCE_FEE },
    { key: 'financialCharge' as const, labelKey: 'chargeTypes.financial-charge', chargeType: ChargeType.FINANCIAL_CHARGE },
    { key: 'waterPrepayment' as const, labelKey: 'chargeTypes.water-prepayment', chargeType: ChargeType.WATER_PREPAYMENT },
    { key: 'otherChargeBased' as const, labelKey: 'chargeTypes.other-charge-based', chargeType: ChargeType.OTHER_CHARGE_BASED },
  ];

  // Validation errors
  const [startDateError, setStartDateError] = useState<string>('');
  const [endDateError, setEndDateError] = useState<string>('');

  // Calculate total from all charge fields
  const total = charges.maintenanceFee + charges.financialCharge + charges.waterPrepayment + charges.otherChargeBased;

  const handleChargeChange = (key: keyof typeof charges) => (value: number | undefined) => {
    setCharges(prev => ({ ...prev, [key]: value ?? 0 }));
  };

  const handleStartDateChange = (value: Dayjs | null) => {
    setStartDate(value ? value.toDate() : null);
    setStartDateError('');
    setEndDateError('');
  };

  const handleEndDateChange = (value: Dayjs | null) => {
    setEndDate(value ? value.toDate() : null);
    setEndDateError('');
  };

  const handleSubmit = () => {
    // Validate start date
    if (!startDate) {
      setStartDateError(t('startDateRequired'));
      return;
    }

    // Validate end date is not before start date
    if (endDate && dayjs(endDate).isBefore(dayjs(startDate), 'day')) {
      setEndDateError(t('endDateMustBeAfterStartDate'));
      return;
    }

    // Use dayjs to format in local time (avoids UTC timezone shift)
    const dateStr = dayjs(startDate).format('YYYY-MM-DD');
    const endDateStr = endDate ? dayjs(endDate).format('YYYY-MM-DD') : null;

    // Build charge inputs (include zero amounts)
    const chargeInputs: PropertyChargeInput[] = chargeFields
      .map(({ key, chargeType }) => ({
        propertyId,
        chargeType,
        amount: charges[key],
        startDate: dateStr,
        endDate: endDateStr,
      }));

    onSubmit(chargeInputs);
  };

  return (
    <Box>
      {/* Date pickers */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <AssetDatePicker
          label={t('startDate')}
          value={startDate}
          onChange={handleStartDateChange}
          error={!!startDateError}
          helperText={startDateError}
        />
        <AssetDatePicker
          label={t('endDate')}
          value={endDate}
          onChange={handleEndDateChange}
          error={!!endDateError}
          helperText={endDateError || t('leaveEmptyForValidUntilFurtherNotice')}
        />
      </Box>

      {/* Charge input cards */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {chargeFields.map(({ key, labelKey }) => (
          <Box
            key={key}
            sx={{
              flex: '1 1 0',
              minWidth: 140,
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 2,
            }}
          >
            <AssetMoneyField
              label={t(labelKey)}
              value={charges[key] || ''}
              onChange={handleChargeChange(key)}
              fullWidth
            />
          </Box>
        ))}
      </Box>

      {/* Total display */}
      <Box
        sx={{
          textAlign: 'center',
          py: 2,
          px: 3,
          mb: 3,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 2,
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          {t('total')}
        </Typography>
        <Typography variant="h5" fontWeight={700} component="span" sx={{ ml: 1 }}>
          {formatCurrency(total, 2)}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9, ml: 0.5 }}>
          {t('perMonth')}
        </Typography>
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <AssetButton
          label={t('cancel')}
          variant="outlined"
          onClick={onCancel}
        />
        <AssetButton
          label={t('save')}
          variant="contained"
          onClick={handleSubmit}
        />
      </Box>
    </Box>
  );
}

export default SeasonChargeForm;
