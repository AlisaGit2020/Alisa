import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Button, Grid, TextField } from "@mui/material";
import React from "react";

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
  const getDefaultFormData = () => ({
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
  });

  const [formData, setFormData] = React.useState<InvestmentInputData>(getDefaultFormData());

  // Reset form when initialValues change (e.g., when switching tabs or clearing)
  React.useEffect(() => {
    setFormData(getDefaultFormData());
  }, [initialValues]);

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
          <TextField
            fullWidth
            required
            label={t('investment-calculator:name')}
            value={formData.name}
            onChange={handleNameChange}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type="number"
            label={t('investment-calculator:deptFreePrice')}
            value={formData.deptFreePrice}
            onChange={handleChange('deptFreePrice')}
            inputProps={{ step: 1000 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type="number"
            label={t('investment-calculator:deptShare')}
            value={formData.deptShare}
            onChange={handleChange('deptShare')}
            inputProps={{ step: 1000 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type="number"
            label={t('investment-calculator:transferTaxPercent')}
            value={formData.transferTaxPercent}
            onChange={handleChange('transferTaxPercent')}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type="number"
            label={t('investment-calculator:maintenanceFee')}
            value={formData.maintenanceFee}
            onChange={handleChange('maintenanceFee')}
            inputProps={{ step: 10 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type="number"
            label={t('investment-calculator:chargeForFinancialCosts')}
            value={formData.chargeForFinancialCosts}
            onChange={handleChange('chargeForFinancialCosts')}
            inputProps={{ step: 10 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type="number"
            label={t('investment-calculator:rentPerMonth')}
            value={formData.rentPerMonth}
            onChange={handleChange('rentPerMonth')}
            inputProps={{ step: 50 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label={t('investment-calculator:apartmentSize')}
            value={formData.apartmentSize}
            onChange={handleChange('apartmentSize')}
            inputProps={{ step: 1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label={t('investment-calculator:waterCharge')}
            value={formData.waterCharge}
            onChange={handleChange('waterCharge')}
            inputProps={{ step: 5 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label={t('investment-calculator:downPayment')}
            value={formData.downPayment}
            onChange={handleChange('downPayment')}
            inputProps={{ step: 1000 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label={t('investment-calculator:loanInterestPercent')}
            value={formData.loanInterestPercent}
            onChange={handleChange('loanInterestPercent')}
            inputProps={{ step: 0.1 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label={t('investment-calculator:loanPeriod')}
            value={formData.loanPeriod}
            onChange={handleChange('loanPeriod')}
            inputProps={{ step: 1 }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Button
            type="submit"
            variant="contained"
            size="medium"
          >
            {t('investment-calculator:calculate')}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default withTranslation(['investment-calculator'])(InvestmentCalculatorForm);
