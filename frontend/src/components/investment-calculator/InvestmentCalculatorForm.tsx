import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Grid } from "@mui/material";
import React from "react";
import { AlisaButton, AlisaNumberField, AlisaTextField } from "../alisa";

export interface InvestmentInputData {
  deptFreePrice: number;
  deptShare: number;
  transferTaxPercent: number;
  maintenanceFee: number;
  chargeForFinancialCosts: number;
  rentPerMonth: number;
  apartmentSize?: number;
  waterCharge?: number;
  downPayment?: number;
  loanInterestPercent?: number;
  loanPeriod?: number;
  propertyId?: number;
  name?: string;
}

interface InvestmentCalculatorFormProps extends WithTranslation {
  onCalculate: (data: InvestmentInputData) => void;
  initialValues?: Partial<InvestmentInputData>;
}

function InvestmentCalculatorForm({ t, onCalculate, initialValues }: InvestmentCalculatorFormProps) {
  const getDefaultFormData = React.useCallback(() => ({
    deptFreePrice: initialValues?.deptFreePrice ?? 100000,
    deptShare: initialValues?.deptShare ?? 0,
    transferTaxPercent: initialValues?.transferTaxPercent ?? 2,
    maintenanceFee: initialValues?.maintenanceFee ?? 200,
    chargeForFinancialCosts: initialValues?.chargeForFinancialCosts ?? 50,
    rentPerMonth: initialValues?.rentPerMonth ?? 800,
    apartmentSize: initialValues?.apartmentSize ?? 50,
    waterCharge: initialValues?.waterCharge ?? 20,
    downPayment: initialValues?.downPayment ?? 0,
    loanInterestPercent: initialValues?.loanInterestPercent ?? 0,
    loanPeriod: initialValues?.loanPeriod ?? 0,
    name: initialValues?.name ?? '',
  }), [initialValues]);

  const [formData, setFormData] = React.useState<InvestmentInputData>(getDefaultFormData());

  // Reset form when initialValues change (e.g., when switching tabs or clearing)
  React.useEffect(() => {
    setFormData(getDefaultFormData());
  }, [getDefaultFormData]);

  const handleChange = (field: keyof InvestmentInputData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value === '' ? 0 : Number(event.target.value);
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      name: event.target.value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onCalculate(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, maxWidth: 800 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <AlisaTextField
            label={t('investment-calculator:name')}
            value={formData.name}
            onChange={handleNameChange}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AlisaNumberField
            label={t('investment-calculator:deptFreePrice')}
            value={formData.deptFreePrice}
            onChange={handleChange('deptFreePrice')}
            step={1000}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AlisaNumberField
            label={t('investment-calculator:deptShare')}
            value={formData.deptShare}
            onChange={handleChange('deptShare')}
            step={1000}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AlisaNumberField
            label={t('investment-calculator:transferTaxPercent')}
            value={formData.transferTaxPercent}
            onChange={handleChange('transferTaxPercent')}
            step={0.1}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AlisaNumberField
            label={t('investment-calculator:maintenanceFee')}
            value={formData.maintenanceFee}
            onChange={handleChange('maintenanceFee')}
            step={10}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AlisaNumberField
            label={t('investment-calculator:chargeForFinancialCosts')}
            value={formData.chargeForFinancialCosts}
            onChange={handleChange('chargeForFinancialCosts')}
            step={10}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AlisaNumberField
            label={t('investment-calculator:rentPerMonth')}
            value={formData.rentPerMonth}
            onChange={handleChange('rentPerMonth')}
            step={50}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AlisaNumberField
            label={t('investment-calculator:apartmentSize')}
            value={formData.apartmentSize ?? 0}
            onChange={handleChange('apartmentSize')}
            step={1}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AlisaNumberField
            label={t('investment-calculator:waterCharge')}
            value={formData.waterCharge ?? 0}
            onChange={handleChange('waterCharge')}
            step={5}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AlisaNumberField
            label={t('investment-calculator:downPayment')}
            value={formData.downPayment ?? 0}
            onChange={handleChange('downPayment')}
            step={1000}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AlisaNumberField
            label={t('investment-calculator:loanInterestPercent')}
            value={formData.loanInterestPercent ?? 0}
            onChange={handleChange('loanInterestPercent')}
            step={0.1}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AlisaNumberField
            label={t('investment-calculator:loanPeriod')}
            value={formData.loanPeriod ?? 0}
            onChange={handleChange('loanPeriod')}
            step={1}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <AlisaButton
            type="submit"
            label={t('investment-calculator:calculate')}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default withTranslation(['investment-calculator'])(InvestmentCalculatorForm);
