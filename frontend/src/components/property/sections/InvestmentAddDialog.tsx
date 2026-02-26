import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  Divider,
  Alert,
} from '@mui/material';
import { AxiosResponse } from 'axios';
import { Property } from '@asset-types';
import { SavedInvestmentCalculation } from '../../investment-calculator/InvestmentCalculatorResults';
import { AssetButton, AssetTextField, AssetEditableNumber } from '../../asset';
import ApiClient from '@asset-lib/api-client';

interface InvestmentAddDialogProps {
  open: boolean;
  property: Property;
  onClose: () => void;
  onSave: (calculation: SavedInvestmentCalculation) => void;
}

interface FormData {
  name: string;
  deptFreePrice: number;
  transferTaxPercent: number;
  rentPerMonth: number;
  apartmentSize: number;
  downPayment: number;
  loanInterestPercent: number;
  loanPeriod: number;
}

interface FormErrors {
  name?: string;
  deptFreePrice?: string;
  rentPerMonth?: string;
}

const getDefaultFormData = (property: Property): FormData => ({
  name: '',
  deptFreePrice: property.purchasePrice ?? 100000,
  transferTaxPercent: 2,
  rentPerMonth: property.monthlyRent ?? 800,
  apartmentSize: property.size || 50,
  downPayment: 0,
  loanInterestPercent: 4,
  loanPeriod: 25,
});

// Fields that can be pre-filled from property data
type PreFillableField = 'rentPerMonth' | 'apartmentSize';

const getPreFilledFields = (property: Property): Set<PreFillableField> => {
  const fields = new Set<PreFillableField>();
  if (property.monthlyRent !== undefined && property.monthlyRent !== null) fields.add('rentPerMonth');
  if (property.size !== undefined && property.size !== null) fields.add('apartmentSize');
  return fields;
};

function InvestmentAddDialog({
  open,
  property,
  onClose,
  onSave,
}: InvestmentAddDialogProps) {
  const { t } = useTranslation(['investment-calculator', 'common']);
  const [formData, setFormData] = useState<FormData>(getDefaultFormData(property));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track which fields were pre-filled from property
  const [preFilledFields, setPreFilledFields] = useState<Set<PreFillableField>>(new Set());

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(getDefaultFormData(property));
      setErrors({});
      setSubmitError(null);
      setPreFilledFields(getPreFilledFields(property));
    }
  }, [open, property]);

  // Check if a field should be read-only (pre-filled from property data)
  const isFieldReadOnly = useCallback((field: PreFillableField): boolean => {
    return preFilledFields.has(field);
  }, [preFilledFields]);

  const handleChange = useCallback((field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('common:validation.required');
    }

    if (formData.deptFreePrice <= 0) {
      newErrors.deptFreePrice = t('common:validation.mustBePositive');
    }

    if (formData.rentPerMonth <= 0) {
      newErrors.rentPerMonth = t('common:validation.mustBePositive');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Include property cost fields in the submission
      const submissionData = {
        ...formData,
        propertyId: property.id,
        // Cost fields come from property
        deptShare: property.debtShare ?? 0,
        maintenanceFee: property.maintenanceFee ?? 0,
        chargeForFinancialCosts: property.financialCharge ?? 0,
        waterCharge: property.waterCharge ?? 0,
      };

      // ApiClient.post returns axios response (type mismatch in ApiClient)
      const response = await ApiClient.post('real-estate/investment', submissionData) as unknown as AxiosResponse<SavedInvestmentCalculation>;
      onSave(response.data);
      onClose();
    } catch (error) {
      console.error('Failed to save calculation:', error);
      setSubmitError(t('common:toast.error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, property, validate, onSave, onClose, t]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('investment-calculator:newCalculation')}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Calculation Name */}
            <Grid size={{ xs: 12 }}>
              <AssetTextField
                label={t('investment-calculator:name')}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>

            {/* Property Details Section */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {t('investment-calculator:sectionPropertyDetails')}
              </Typography>
              <Divider />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetEditableNumber
                label={t('investment-calculator:deptFreePrice')}
                value={formData.deptFreePrice}
                onChange={(e) => handleChange('deptFreePrice', Number(e.target.value) || 0)}
                step={1000}
                suffix="€"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetEditableNumber
                label={t('investment-calculator:apartmentSize')}
                value={formData.apartmentSize}
                onChange={(e) => handleChange('apartmentSize', Number(e.target.value) || 0)}
                step={1}
                suffix={t('common:suffix.squareMeters')}
                readOnly={isFieldReadOnly('apartmentSize')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetEditableNumber
                label={t('investment-calculator:transferTaxPercent')}
                value={formData.transferTaxPercent}
                onChange={(e) => handleChange('transferTaxPercent', Number(e.target.value) || 0)}
                step={0.1}
                suffix="%"
              />
            </Grid>

            {/* Rental Income Section */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {t('investment-calculator:sectionRentalIncome')}
              </Typography>
              <Divider />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetEditableNumber
                label={t('investment-calculator:rentPerMonth')}
                value={formData.rentPerMonth}
                onChange={(e) => handleChange('rentPerMonth', Number(e.target.value) || 0)}
                step={50}
                suffix={t('common:suffix.euroPerMonth')}
                readOnly={isFieldReadOnly('rentPerMonth')}
              />
            </Grid>

            {/* Financing Section */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {t('investment-calculator:sectionFinancing')}
              </Typography>
              <Divider />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetEditableNumber
                label={t('investment-calculator:downPayment')}
                value={formData.downPayment}
                onChange={(e) => handleChange('downPayment', Number(e.target.value) || 0)}
                step={1000}
                suffix="€"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetEditableNumber
                label={t('investment-calculator:loanInterestPercent')}
                value={formData.loanInterestPercent}
                onChange={(e) => handleChange('loanInterestPercent', Number(e.target.value) || 0)}
                step={0.1}
                suffix="%"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetEditableNumber
                label={t('investment-calculator:loanPeriod')}
                value={formData.loanPeriod}
                onChange={(e) => handleChange('loanPeriod', Number(e.target.value) || 0)}
                step={1}
                suffix={t('common:suffix.years')}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <AssetButton
          label={t('common:cancel')}
          variant="outlined"
          onClick={onClose}
          disabled={isSubmitting}
        />
        <AssetButton
          label={t('common:save')}
          onClick={handleSubmit}
          loading={isSubmitting}
        />
      </DialogActions>
    </Dialog>
  );
}

export default InvestmentAddDialog;
