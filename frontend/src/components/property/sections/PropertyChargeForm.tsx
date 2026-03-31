import { Box, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChargeType, chargeTypeNames, PropertyCharge, PropertyChargeInput } from '@asset-types';
import AssetButton from '../../asset/form/AssetButton';
import AssetMoneyField from '../../asset/form/AssetMoneyField';
import AssetDatePicker from '../../asset/form/AssetDatePicker';
import AssetSelectField from '../../asset/form/AssetSelectField';
import dayjs from 'dayjs';

interface PropertyChargeFormProps {
  propertyId: number;
  charge?: PropertyCharge;
  onSubmit: (input: PropertyChargeInput) => void;
  onCancel: () => void;
}

const chargeTypeItems = [
  { id: ChargeType.MAINTENANCE_FEE, key: 'maintenance-fee' },
  { id: ChargeType.FINANCIAL_CHARGE, key: 'financial-charge' },
  { id: ChargeType.WATER_PREPAYMENT, key: 'water-prepayment' },
  { id: ChargeType.TOTAL_CHARGE, key: 'total-charge' },
];

function PropertyChargeForm({ propertyId, charge, onSubmit, onCancel }: PropertyChargeFormProps) {
  const { t } = useTranslation('property');
  const isEdit = !!charge;

  const [chargeType, setChargeType] = useState<ChargeType>(
    charge?.chargeType ?? ChargeType.MAINTENANCE_FEE
  );
  const [amount, setAmount] = useState<number>(charge?.amount ?? 0);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(
    charge?.startDate ? dayjs(charge.startDate) : null
  );
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(
    charge?.endDate ? dayjs(charge.endDate) : null
  );
  const [errors, setErrors] = useState<{
    startDate?: string;
    amount?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!startDate) {
      newErrors.startDate = t('startDateRequired');
    }

    if (amount < 0) {
      newErrors.amount = t('amountMustBePositive');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const input: PropertyChargeInput = {
      id: charge?.id,
      propertyId,
      chargeType,
      amount,
      startDate: startDate!.format('YYYY-MM-DD'),
      endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
    };

    onSubmit(input);
  };

  return (
    <Box component="form" role="form">
      <Typography variant="h6" sx={{ mb: 2 }}>
        {isEdit ? t('editCharge') : t('addCharge')}
      </Typography>

      <Stack spacing={2}>
        <AssetSelectField
          label={t('chargeType')}
          value={chargeType}
          items={chargeTypeItems}
          t={t}
          translateKeyPrefix="chargeTypes"
          onChange={(e) => setChargeType(Number(e.target.value) as ChargeType)}
          disabled={isEdit}
          aria-label={t('chargeType')}
        />

        <AssetMoneyField
          label={t('chargeAmount')}
          value={amount}
          onChange={(value) => setAmount(value ?? 0)}
          error={!!errors.amount}
          helperText={errors.amount}
          aria-label={t('chargeAmount')}
        />

        <AssetDatePicker
          label={t('startDate')}
          value={startDate}
          onChange={(date) => setStartDate(date)}
          slotProps={{
            textField: {
              error: !!errors.startDate,
              helperText: errors.startDate,
              inputProps: { 'aria-label': t('startDate') },
            },
          }}
        />

        <AssetDatePicker
          label={t('endDate')}
          value={endDate}
          onChange={(date) => setEndDate(date)}
          slotProps={{
            textField: {
              helperText: t('leaveEmptyForValidUntilFurtherNotice'),
              inputProps: { 'aria-label': t('endDate') },
            },
          }}
        />

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
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
        </Stack>
      </Stack>
    </Box>
  );
}

export default PropertyChargeForm;