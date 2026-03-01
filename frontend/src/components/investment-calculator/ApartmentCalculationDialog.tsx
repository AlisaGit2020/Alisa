import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Divider,
  Grid,
  Avatar,
  useTheme,
} from '@mui/material';
import { Property } from '@asset-types';
import ApiClient from '@asset-lib/api-client';
import { AssetDialog, AssetTextField, AssetButton, AssetAlert } from '../asset';
import { getPhotoUrl } from '@asset-lib/functions';

interface InvestmentCalculationInput {
  name: string;
  deptFreePrice: number;
  deptShare: number;
  transferTaxPercent: number;
  maintenanceFee: number;
  chargeForFinancialCosts: number;
  rentPerMonth: number;
  apartmentSize: number;
  waterCharge: number;
  downPayment: number;
  loanInterestPercent: number;
  loanPeriod: number;
  propertyId?: number;
}

interface SavedCalculation {
  id: number;
  name: string;
  deptFreePrice: number;
  rentPerMonth: number;
  rentalYieldPercent?: number;
  propertyId?: number;
}

interface EditableFieldProps {
  value: number;
  onSave: (value: number) => void;
  suffix?: string;
}

function EditableField({ value, onSave, suffix = '' }: EditableFieldProps) {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onSave(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onSave(editValue);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        role="spinbutton"
        value={editValue}
        onChange={(e) => setEditValue(Number(e.target.value))}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        style={{
          width: '100%',
          padding: '4px 8px',
          fontSize: 'inherit',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '4px',
        }}
      />
    );
  }

  return (
    <Typography
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover',
          borderRadius: 1,
        },
        p: 0.5,
      }}
    >
      {value.toLocaleString()}{suffix}
    </Typography>
  );
}

interface ApartmentCalculationDialogProps {
  open: boolean;
  property?: Property;
  onClose: () => void;
  onSave: (calculation: SavedCalculation) => void;
}

function ApartmentCalculationDialog({
  open,
  property,
  onClose,
  onSave,
}: ApartmentCalculationDialogProps) {
  const { t } = useTranslation(['investment-calculator', 'common']);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Default values
  const getDefaultData = useCallback((): InvestmentCalculationInput => ({
    name: '',
    deptFreePrice: property?.purchasePrice ?? 100000,
    deptShare: 0,
    transferTaxPercent: 2,
    maintenanceFee: property?.maintenanceFee ?? 200,
    chargeForFinancialCosts: property?.financialCharge ?? 50,
    rentPerMonth: property?.monthlyRent ?? 800,
    apartmentSize: property?.size ?? 50,
    waterCharge: 20,
    downPayment: 0,
    loanInterestPercent: 4,
    loanPeriod: 25,
    propertyId: property?.id,
  }), [property?.purchasePrice, property?.maintenanceFee, property?.financialCharge, property?.monthlyRent, property?.size, property?.id]);

  const [data, setData] = useState<InvestmentCalculationInput>(getDefaultData());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);

  // Reset form when dialog opens/closes or property changes
  useEffect(() => {
    if (open) {
      setData(getDefaultData());
      setError(null);
      setNameError(false);
      // Focus on name input after dialog opens
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [open, property?.id, getDefaultData]);

  const handleChange = <K extends keyof InvestmentCalculationInput>(
    field: K,
    value: InvestmentCalculationInput[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  // Calculate rental yield for display
  const calculateRentalYield = (): number => {
    if (data.deptFreePrice <= 0) return 0;
    const yearlyRent = data.rentPerMonth * 12;
    const yearlyExpenses = (data.maintenanceFee + data.chargeForFinancialCosts + data.waterCharge) * 12;
    const netYearlyIncome = yearlyRent - yearlyExpenses;
    return (netYearlyIncome / data.deptFreePrice) * 100;
  };

  const handleSave = async () => {
    // Validate name
    if (!data.name.trim()) {
      setNameError(true);
      return;
    }

    setSaving(true);
    setError(null);
    setNameError(false);

    try {
      const requestData = {
        ...data,
        propertyId: property?.id,
      };
      const result = await ApiClient.post<typeof requestData>('real-estate/investment', requestData);
      // The API returns the saved calculation with id
      onSave(result as unknown as SavedCalculation);
      onClose();
    } catch (err) {
      console.error('Failed to save calculation:', err);
      setError(t('investment-calculator:addCalculationError'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const photoUrl = getPhotoUrl(property?.photo);
  const streetName = property?.address?.street;

  const dialogActions = (
    <>
      <AssetButton
        label={t('common:cancel')}
        variant="text"
        onClick={handleCancel}
      />
      <AssetButton
        label={t('common:save')}
        onClick={handleSave}
        disabled={saving}
      />
    </>
  );

  return (
    <AssetDialog
      open={open}
      onClose={handleCancel}
      title={t('investment-calculator:addCalculation')}
      actions={dialogActions}
    >
      <Box sx={{ pt: 1 }}>
        {/* Property header */}
        {property && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              src={photoUrl}
              alt={property.name}
              sx={{ width: 56, height: 56 }}
            >
              {property.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">{property.name}</Typography>
              {streetName && (
                <Typography variant="body2" color="text.secondary">
                  {streetName}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Box sx={{ mb: error ? 2 : 0 }}>
          <AssetAlert severity="error" content={error ?? undefined} />
        </Box>

        {/* Name field */}
        <AssetTextField
          inputRef={nameInputRef}
          label={t('investment-calculator:calculationName')}
          value={data.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder={t('investment-calculator:calculationNamePlaceholder')}
          error={nameError}
          helperText={nameError ? t('common:validation.required') : undefined}
          autoFocus
          sx={{ mb: 2 }}
        />

        {/* Property Details Section */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
          {t('investment-calculator:propertyDetails')}
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="text.secondary">
              {t('investment-calculator:deptFreePrice')}
            </Typography>
            <EditableField
              value={data.deptFreePrice}
              onSave={(v) => handleChange('deptFreePrice', v)}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="text.secondary">
              {t('investment-calculator:apartmentSize')}
            </Typography>
            <EditableField
              value={data.apartmentSize}
              onSave={(v) => handleChange('apartmentSize', v)}
              suffix=" m2"
            />
          </Grid>
        </Grid>

        {/* Rental Income Section */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3 }}>
          {t('investment-calculator:rentalIncome')}
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="text.secondary">
              {t('investment-calculator:rentPerMonth')}
            </Typography>
            <EditableField
              value={data.rentPerMonth}
              onSave={(v) => handleChange('rentPerMonth', v)}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="text.secondary">
              {t('investment-calculator:maintenanceFee')}
            </Typography>
            <EditableField
              value={data.maintenanceFee}
              onSave={(v) => handleChange('maintenanceFee', v)}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="text.secondary">
              {t('investment-calculator:chargeForFinancialCosts')}
            </Typography>
            <EditableField
              value={data.chargeForFinancialCosts}
              onSave={(v) => handleChange('chargeForFinancialCosts', v)}
            />
          </Grid>
        </Grid>

        {/* Financing Section */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3 }}>
          {t('investment-calculator:financing')}
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="text.secondary">
              {t('investment-calculator:downPayment')}
            </Typography>
            <EditableField
              value={data.downPayment}
              onSave={(v) => handleChange('downPayment', v)}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="text.secondary">
              {t('investment-calculator:loanInterestPercent')}
            </Typography>
            <EditableField
              value={data.loanInterestPercent}
              onSave={(v) => handleChange('loanInterestPercent', v)}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="text.secondary">
              {t('investment-calculator:loanPeriod')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditableField
                value={data.loanPeriod}
                onSave={(v) => handleChange('loanPeriod', v)}
              />
              <Typography variant="body2" color="text.secondary">
                {t('investment-calculator:loanPeriodYears')}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Calculated yield preview */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('investment-calculator:rentalYieldPercent')}
          </Typography>
          <Typography variant="h6">
            {`${calculateRentalYield().toFixed(2)}%`}
          </Typography>
        </Box>
      </Box>
    </AssetDialog>
  );
}

export default ApartmentCalculationDialog;