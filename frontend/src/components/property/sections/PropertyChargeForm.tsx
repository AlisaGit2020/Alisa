import { Box, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChargeType, PropertyCharge, PropertyChargeInput } from '@asset-types';
import AssetButton from '../../asset/form/AssetButton';
import AssetMoneyField from '../../asset/form/AssetMoneyField';
import AssetDatePicker from '../../asset/form/AssetDatePicker';
import AssetSelectField from '../../asset/form/AssetSelectField';
import dayjs from 'dayjs';

interface PropertyChargeFormProps {
  propertyId: number;
  charge?: PropertyCharge;
  defaultChargeType?: ChargeType;
  onSubmit: (input: PropertyChargeInput) => void;
  onCancel: () => void;
}

function PropertyChargeForm({ propertyId, charge, defaultChargeType, onSubmit, onCancel }: PropertyChargeFormProps) {
  const { t } = useTranslation('property');

  // Define items inside component to use translated names
  const chargeTypeItems = [
    { id: ChargeType.MAINTENANCE_FEE, name: t('chargeTypes.maintenance-fee') },
    { id: ChargeType.FINANCIAL_CHARGE, name: t('chargeTypes.financial-charge') },
    { id: ChargeType.WATER_PREPAYMENT, name: t('chargeTypes.water-prepayment') },
    { id: ChargeType.TOTAL_CHARGE, name: t('chargeTypes.total-charge') },
  ];
  const isEdit = !!charge;
  const isTypeFixed = isEdit || defaultChargeType !== undefined;

  const [chargeType, setChargeType] = useState<ChargeType>(
    charge?.chargeType ?? defaultChargeType ?? ChargeType.MAINTENANCE_FEE
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
    endDate?: string;
    amount?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!startDate) {
      newErrors.startDate = t('startDateRequired');
    }

    if (endDate && startDate && endDate.isBefore(startDate)) {
      newErrors.endDate = t('endDateMustBeAfterStartDate');
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
          onChange={(e) => setChargeType(Number(e.target.value) as ChargeType)}
          disabled={isTypeFixed}
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
          error={!!errors.startDate}
          helperText={errors.startDate}
        />

        <AssetDatePicker
          label={t('endDate')}
          value={endDate}
          onChange={(date) => setEndDate(date)}
          error={!!errors.endDate}
          helperText={errors.endDate || t('leaveEmptyForValidUntilFurtherNotice')}
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