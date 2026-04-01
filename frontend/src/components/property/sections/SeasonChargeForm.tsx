import { useState, useMemo } from 'react';
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

  // State for charge amounts
  const [maintenanceFee, setMaintenanceFee] = useState<number | undefined>(initialValues?.maintenanceFee ?? 0);
  const [financialCharge, setFinancialCharge] = useState<number | undefined>(initialValues?.financialCharge ?? 0);
  const [waterPrepayment, setWaterPrepayment] = useState<number | undefined>(initialValues?.waterPrepayment ?? 0);
  const [otherCharge, setOtherCharge] = useState<number | undefined>(initialValues?.otherChargeBased ?? 0);

  // Validation errors
  const [startDateError, setStartDateError] = useState<string>('');
  const [endDateError, setEndDateError] = useState<string>('');

  // Calculate total
  const total = useMemo(() => {
    return (maintenanceFee ?? 0) + (financialCharge ?? 0) + (waterPrepayment ?? 0) + (otherCharge ?? 0);
  }, [maintenanceFee, financialCharge, waterPrepayment, otherCharge]);

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

    // Build charge inputs array
    const charges: PropertyChargeInput[] = [];

    // Use dayjs to format in local time (avoids UTC timezone shift)
    const dateStr = dayjs(startDate).format('YYYY-MM-DD');
    const endDateStr = endDate ? dayjs(endDate).format('YYYY-MM-DD') : null;

    // Add maintenance fee (only if > 0)
    if (maintenanceFee && maintenanceFee > 0) {
      charges.push({
        propertyId,
        chargeType: ChargeType.MAINTENANCE_FEE,
        amount: maintenanceFee,
        startDate: dateStr,
        endDate: endDateStr,
      });
    }

    // Add financial charge (only if > 0)
    if (financialCharge && financialCharge > 0) {
      charges.push({
        propertyId,
        chargeType: ChargeType.FINANCIAL_CHARGE,
        amount: financialCharge,
        startDate: dateStr,
        endDate: endDateStr,
      });
    }

    // Add water prepayment (only if > 0)
    if (waterPrepayment && waterPrepayment > 0) {
      charges.push({
        propertyId,
        chargeType: ChargeType.WATER_PREPAYMENT,
        amount: waterPrepayment,
        startDate: dateStr,
        endDate: endDateStr,
      });
    }

    // Add other charge (only if > 0)
    if (otherCharge && otherCharge > 0) {
      charges.push({
        propertyId,
        chargeType: ChargeType.OTHER_CHARGE_BASED,
        amount: otherCharge,
        startDate: dateStr,
        endDate: endDateStr,
      });
    }

    // Total is calculated on read from component charges
    onSubmit(charges);
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
        <Box
          sx={{
            flex: '1 1 0',
            minWidth: 140,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 2,
          }}
        >
          <AssetMoneyField
            label={t('chargeTypes.maintenance-fee')}
            value={maintenanceFee ?? ''}
            onChange={setMaintenanceFee}
            fullWidth
          />
        </Box>

        <Box
          sx={{
            flex: '1 1 0',
            minWidth: 140,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 2,
          }}
        >
          <AssetMoneyField
            label={t('chargeTypes.financial-charge')}
            value={financialCharge ?? ''}
            onChange={setFinancialCharge}
            fullWidth
          />
        </Box>

        <Box
          sx={{
            flex: '1 1 0',
            minWidth: 140,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 2,
          }}
        >
          <AssetMoneyField
            label={t('chargeTypes.water-prepayment')}
            value={waterPrepayment ?? ''}
            onChange={setWaterPrepayment}
            fullWidth
          />
        </Box>

        <Box
          sx={{
            flex: '1 1 0',
            minWidth: 140,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 2,
          }}
        >
          <AssetMoneyField
            label={t('chargeTypes.other-charge-based')}
            value={otherCharge ?? ''}
            onChange={setOtherCharge}
            fullWidth
          />
        </Box>
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
