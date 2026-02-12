import { WithTranslation, withTranslation } from "react-i18next";
import { Box, CircularProgress, Divider, Grid, InputAdornment, TextField, Typography } from "@mui/material";
import React from "react";
import axios from "axios";
import { AlisaButton, AlisaNumberField, AlisaTextField, useToast } from "../alisa";
import { VITE_API_URL } from "../../constants";

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

interface EtuoviPropertyData {
  url: string;
  deptFreePrice: number;
  deptShare?: number;
  apartmentSize: number;
  maintenanceFee: number;
  waterCharge?: number;
  chargeForFinancialCosts?: number;
  address?: string;
}

interface InvestmentCalculatorFormProps extends WithTranslation {
  onCalculate: (data: InvestmentInputData) => void;
  initialValues?: Partial<InvestmentInputData>;
}

function InvestmentCalculatorForm({ t, onCalculate, initialValues }: InvestmentCalculatorFormProps) {
  const { showToast } = useToast();
  const [etuoviUrl, setEtuoviUrl] = React.useState('');
  const [isFetching, setIsFetching] = React.useState(false);

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

  const isValidEtuoviUrl = (url: string): boolean => {
    const pattern = /^https?:\/\/(www\.)?etuovi\.com\/kohde\//;
    return pattern.test(url);
  };

  const handleFetchFromEtuovi = async () => {
    if (!etuoviUrl.trim()) {
      return;
    }

    if (!isValidEtuoviUrl(etuoviUrl)) {
      showToast({ message: t('investment-calculator:invalidUrl'), severity: 'error' });
      return;
    }

    setIsFetching(true);
    try {
      const response = await axios.post<EtuoviPropertyData>(
        `${VITE_API_URL}/import/etuovi/fetch`,
        { url: etuoviUrl }
      );

      const data = response.data;
      setFormData(prev => ({
        ...prev,
        deptFreePrice: data.deptFreePrice,
        deptShare: data.deptShare ?? prev.deptShare,
        apartmentSize: data.apartmentSize,
        maintenanceFee: data.maintenanceFee,
        waterCharge: data.waterCharge ?? prev.waterCharge,
        chargeForFinancialCosts: data.chargeForFinancialCosts ?? prev.chargeForFinancialCosts,
        name: data.address || prev.name,
      }));

      showToast({ message: t('investment-calculator:fetchSuccess'), severity: 'success' });
    } catch (error) {
      console.error('Etuovi fetch error:', error);
      showToast({ message: t('investment-calculator:fetchError'), severity: 'error' });
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, maxWidth: 800 }}>
      <Grid container spacing={2}>
        {/* Etuovi URL fetch section */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            etuovi.com
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              label={t('investment-calculator:etuoviUrl')}
              value={etuoviUrl}
              onChange={(e) => setEtuoviUrl(e.target.value)}
              placeholder="https://www.etuovi.com/kohde/..."
              sx={{ flexGrow: 1 }}
              slotProps={{
                input: {
                  endAdornment: isFetching ? (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ) : undefined,
                }
              }}
            />
            <AlisaButton
              label={t('investment-calculator:fetchFromEtuovi')}
              onClick={handleFetchFromEtuovi}
              disabled={isFetching || !etuoviUrl.trim()}
              sx={{ mt: 0, minWidth: 120 }}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 1 }} />
        </Grid>

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
