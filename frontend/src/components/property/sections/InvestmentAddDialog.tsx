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
import { Property } from '@asset-types';
import { SavedInvestmentCalculation } from '../../investment-calculator/InvestmentCalculatorResults';
import { AssetButton, AssetTextField, AssetNumberField } from '../../asset';
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
  deptShare: number;
  transferTaxPercent: number;
  maintenanceFee: number;
  chargeForFinancialCosts: number;
  waterCharge: number;
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
  deptFreePrice: 100000,
  deptShare: 0,
  transferTaxPercent: 2,
  maintenanceFee: 200,
  chargeForFinancialCosts: 50,
  waterCharge: 20,
  rentPerMonth: 800,
  apartmentSize: property.size || 50,
  downPayment: 0,
  loanInterestPercent: 4,
  loanPeriod: 25,
});

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

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(getDefaultFormData(property));
      setErrors({});
      setSubmitError(null);
    }
  }, [open, property]);

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
      const result = await ApiClient.postSaveTask('real-estate/investment', {
        ...formData,
        propertyId: property.id,
      });

      if (result.allSuccess && result.results.length > 0) {
        // Fetch the saved calculation to get full data
        const saved = await ApiClient.get<SavedInvestmentCalculation>(
          'real-estate/investment',
          result.results[0].id
        );
        onSave(saved);
        onClose();
      } else {
        setSubmitError(t('common:toast.error'));
      }
    } catch (error) {
      console.error('Failed to save calculation:', error);
      setSubmitError(t('common:toast.error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, property.id, validate, onSave, onClose, t]);

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
              <AssetNumberField
                label={t('investment-calculator:deptFreePrice')}
                value={formData.deptFreePrice}
                onChange={(e) => handleChange('deptFreePrice', Number(e.target.value) || 0)}
                step={1000}
                error={!!errors.deptFreePrice}
                helperText={errors.deptFreePrice}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetNumberField
                label={t('investment-calculator:deptShare')}
                value={formData.deptShare}
                onChange={(e) => handleChange('deptShare', Number(e.target.value) || 0)}
                step={1000}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetNumberField
                label={t('investment-calculator:apartmentSize')}
                value={formData.apartmentSize}
                onChange={(e) => handleChange('apartmentSize', Number(e.target.value) || 0)}
                step={1}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetNumberField
                label={t('investment-calculator:transferTaxPercent')}
                value={formData.transferTaxPercent}
                onChange={(e) => handleChange('transferTaxPercent', Number(e.target.value) || 0)}
                step={0.1}
              />
            </Grid>

            {/* Monthly Costs Section */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {t('investment-calculator:sectionMonthlyCosts')}
              </Typography>
              <Divider />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetNumberField
                label={t('investment-calculator:maintenanceFee')}
                value={formData.maintenanceFee}
                onChange={(e) => handleChange('maintenanceFee', Number(e.target.value) || 0)}
                step={10}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetNumberField
                label={t('investment-calculator:chargeForFinancialCosts')}
                value={formData.chargeForFinancialCosts}
                onChange={(e) => handleChange('chargeForFinancialCosts', Number(e.target.value) || 0)}
                step={10}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetNumberField
                label={t('investment-calculator:waterCharge')}
                value={formData.waterCharge}
                onChange={(e) => handleChange('waterCharge', Number(e.target.value) || 0)}
                step={5}
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
              <AssetNumberField
                label={t('investment-calculator:rentPerMonth')}
                value={formData.rentPerMonth}
                onChange={(e) => handleChange('rentPerMonth', Number(e.target.value) || 0)}
                step={50}
                error={!!errors.rentPerMonth}
                helperText={errors.rentPerMonth}
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
              <AssetNumberField
                label={t('investment-calculator:downPayment')}
                value={formData.downPayment}
                onChange={(e) => handleChange('downPayment', Number(e.target.value) || 0)}
                step={1000}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetNumberField
                label={t('investment-calculator:loanInterestPercent')}
                value={formData.loanInterestPercent}
                onChange={(e) => handleChange('loanInterestPercent', Number(e.target.value) || 0)}
                step={0.1}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <AssetNumberField
                label={t('investment-calculator:loanPeriod')}
                value={formData.loanPeriod}
                onChange={(e) => handleChange('loanPeriod', Number(e.target.value) || 0)}
                step={1}
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
