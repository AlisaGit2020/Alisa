import { WithTranslation, withTranslation } from "react-i18next";
import { Box, CircularProgress, Divider, Grid, Stack, Typography } from "@mui/material";
import { ChangeEvent, useState } from "react";
import { AssetNumberField, AssetTextField, AssetButton, AssetSelectField, useAssetToast } from "../asset";
import { VITE_API_URL } from "../../constants";
import AssetFormHandler from "../asset/form/AssetFormHandler";
import DataService from "@asset-lib/data-service";
import { investmentCalculationContext } from "@asset-lib/asset-contexts";
import { getFieldErrorProps } from "@asset-lib/form-utils";
import { ListingSource } from "../../types/inputs";

export interface InvestmentInputData {
  id?: number;
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
  etuoviUrl?: string;
}

interface ListingPropertyData {
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
  id?: number;
  initialValues?: Partial<InvestmentInputData>;
  onCancel: () => void;
  onAfterSubmit: () => void;
}

// URL validation patterns
const ETUOVI_URL_PATTERN = /^https?:\/\/(www\.)?etuovi\.com\/kohde\/\d+/;
const OIKOTIE_URL_PATTERN = /^https?:\/\/(www\.)?asunnot\.oikotie\.fi\//;

const SOURCE_ITEMS = [
  { id: 1, name: "Etuovi", key: "etuovi" },
  { id: 2, name: "Oikotie", key: "oikotie" },
];

function InvestmentCalculatorForm({ t, id, initialValues, onCancel, onAfterSubmit }: InvestmentCalculatorFormProps) {
  const { showToast } = useAssetToast();
  const [listingSource, setListingSource] = useState<ListingSource>('etuovi');
  const [listingUrl, setListingUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [urlError, setUrlError] = useState<string | undefined>(undefined);

  const getDefaultFormData = (): InvestmentInputData => ({
    id: initialValues?.id,
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
    loanPeriod: initialValues?.loanPeriod,
    name: initialValues?.name ?? '',
  });

  const [data, setData] = useState<InvestmentInputData>(getDefaultFormData());

  const dataService = new DataService<InvestmentInputData>({
    context: investmentCalculationContext,
  });

  const handleChange = (field: keyof InvestmentInputData, value: unknown) => {
    setData(dataService.updateNestedData(data, field, value));
  };

  const getSourceFromId = (id: number): ListingSource => {
    return id === 2 ? 'oikotie' : 'etuovi';
  };

  const getIdFromSource = (src: ListingSource): number => {
    return src === 'oikotie' ? 2 : 1;
  };

  const handleSourceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newSource = getSourceFromId(Number(e.target.value));
    setListingSource(newSource);
    setUrlError(undefined);
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setListingUrl(e.target.value);
    setUrlError(undefined);
  };

  const getPlaceholder = (): string => {
    return listingSource === 'oikotie'
      ? t('investment-calculator:oikotieUrlPlaceholder')
      : t('investment-calculator:etuoviUrlPlaceholder');
  };

  const validateUrl = (url: string): boolean => {
    const pattern = listingSource === 'oikotie' ? OIKOTIE_URL_PATTERN : ETUOVI_URL_PATTERN;
    const errorKey = listingSource === 'oikotie'
      ? 'investment-calculator:invalidOikotieUrl'
      : 'investment-calculator:invalidEtuoviUrl';

    if (!pattern.test(url)) {
      setUrlError(t(errorKey));
      return false;
    }
    return true;
  };

  const handleFetchFromListing = async () => {
    if (!listingUrl.trim()) {
      return;
    }

    if (!validateUrl(listingUrl)) {
      return;
    }

    setIsFetching(true);
    try {
      // Use fetch API for better test compatibility
      const fetchResponse = await fetch(
        `${VITE_API_URL}/import/${listingSource}/fetch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: listingUrl }),
        }
      );

      if (!fetchResponse.ok) {
        throw new Error('Fetch failed');
      }

      const fetchedData: ListingPropertyData = await fetchResponse.json();
      setData(prev => ({
        ...prev,
        deptFreePrice: fetchedData.deptFreePrice,
        deptShare: fetchedData.deptShare ?? prev.deptShare,
        apartmentSize: fetchedData.apartmentSize,
        maintenanceFee: fetchedData.maintenanceFee,
        waterCharge: fetchedData.waterCharge ?? prev.waterCharge,
        chargeForFinancialCosts: fetchedData.chargeForFinancialCosts ?? prev.chargeForFinancialCosts,
        name: fetchedData.address || prev.name,
        etuoviUrl: fetchedData.url,
      }));

      showToast({ message: t('investment-calculator:fetchSuccess'), severity: 'success' });
    } catch (error) {
      console.error('Listing fetch error:', error);
      showToast({ message: t('investment-calculator:fetchError'), severity: 'error' });
    } finally {
      setIsFetching(false);
    }
  };

  const renderFormContent = (fieldErrors: Partial<Record<keyof InvestmentInputData, string>>) => (
    <Box sx={{ mt: 2, maxWidth: 800 }}>
      <Grid container spacing={2}>
        {/* Listing URL fetch section */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {t('investment-calculator:listingSource')}
          </Typography>
          <Stack spacing={2}>
            <AssetSelectField
              label={t('investment-calculator:listingSource')}
              value={getIdFromSource(listingSource)}
              items={SOURCE_ITEMS}
              onChange={handleSourceChange}
              disabled={isFetching}
              fullWidth
            />
            <AssetTextField
              label=""
              placeholder={getPlaceholder()}
              value={listingUrl}
              onChange={handleUrlChange}
              error={!!urlError}
              helperText={urlError}
              disabled={isFetching}
              fullWidth
            />
            <Box>
              <AssetButton
                label={isFetching ? '' : t('common:search')}
                onClick={handleFetchFromListing}
                disabled={!listingUrl.trim() || isFetching}
                startIcon={isFetching ? <CircularProgress size={20} /> : undefined}
              />
            </Box>
          </Stack>
        </Grid>

        {/* Property Details Section */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t('investment-calculator:sectionPropertyDetails')}
          </Typography>
          <Divider />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <AssetTextField
            label={t('investment-calculator:name')}
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            {...getFieldErrorProps<InvestmentInputData>(fieldErrors, 'name')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetNumberField
            label={t('investment-calculator:deptFreePrice')}
            value={data.deptFreePrice}
            onChange={(e) => handleChange('deptFreePrice', Number(e.target.value) || 0)}
            step={1000}
            {...getFieldErrorProps<InvestmentInputData>(fieldErrors, 'deptFreePrice')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetNumberField
            label={t('investment-calculator:deptShare')}
            value={data.deptShare}
            onChange={(e) => handleChange('deptShare', Number(e.target.value) || 0)}
            step={1000}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetNumberField
            label={t('investment-calculator:transferTaxPercent')}
            value={data.transferTaxPercent}
            onChange={(e) => handleChange('transferTaxPercent', Number(e.target.value) || 0)}
            step={0.1}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetNumberField
            label={t('investment-calculator:apartmentSize')}
            value={data.apartmentSize ?? 0}
            onChange={(e) => handleChange('apartmentSize', Number(e.target.value) || 0)}
            step={1}
          />
        </Grid>

        {/* Monthly Costs Section */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t('investment-calculator:sectionMonthlyCosts')}
          </Typography>
          <Divider />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetNumberField
            label={t('investment-calculator:maintenanceFee')}
            value={data.maintenanceFee}
            onChange={(e) => handleChange('maintenanceFee', Number(e.target.value) || 0)}
            step={10}
            {...getFieldErrorProps<InvestmentInputData>(fieldErrors, 'maintenanceFee')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetNumberField
            label={t('investment-calculator:chargeForFinancialCosts')}
            value={data.chargeForFinancialCosts}
            onChange={(e) => handleChange('chargeForFinancialCosts', Number(e.target.value) || 0)}
            step={10}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetNumberField
            label={t('investment-calculator:waterCharge')}
            value={data.waterCharge ?? 0}
            onChange={(e) => handleChange('waterCharge', Number(e.target.value) || 0)}
            step={5}
          />
        </Grid>

        {/* Rental Income Section */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t('investment-calculator:sectionRentalIncome')}
          </Typography>
          <Divider />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetNumberField
            label={t('investment-calculator:rentPerMonth')}
            value={data.rentPerMonth}
            onChange={(e) => handleChange('rentPerMonth', Number(e.target.value) || 0)}
            step={50}
            {...getFieldErrorProps<InvestmentInputData>(fieldErrors, 'rentPerMonth')}
          />
        </Grid>

        {/* Financing Section */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t('investment-calculator:sectionFinancing')}
          </Typography>
          <Divider />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetNumberField
            label={t('investment-calculator:downPayment')}
            value={data.downPayment ?? 0}
            onChange={(e) => handleChange('downPayment', Number(e.target.value) || 0)}
            step={1000}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetNumberField
            label={t('investment-calculator:loanInterestPercent')}
            value={data.loanInterestPercent ?? 0}
            onChange={(e) => handleChange('loanInterestPercent', Number(e.target.value) || 0)}
            step={0.1}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetNumberField
            label={t('investment-calculator:loanPeriod')}
            value={data.loanPeriod ?? ''}
            onChange={(e) => handleChange('loanPeriod', e.target.value === '' ? undefined : Number(e.target.value))}
            step={1}
            {...getFieldErrorProps<InvestmentInputData>(fieldErrors, 'loanPeriod')}
          />
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <AssetFormHandler<InvestmentInputData>
      id={id}
      dataService={dataService}
      data={data}
      renderForm={renderFormContent}
      onSetData={setData}
      validationRules={{
        name: { required: true },
        deptFreePrice: { required: true, min: 1 },
        maintenanceFee: { min: 0 },
        rentPerMonth: { required: true, min: 1 },
        loanPeriod: { min: 1, max: 50 },
      }}
      translation={{
        cancelButton: t('common:cancel'),
        submitButton: t('common:save'),
        validationMessageTitle: t('common:validationErrorTitle'),
      }}
      onCancel={onCancel}
      onAfterSubmit={onAfterSubmit}
    />
  );
}

export default withTranslation(['investment-calculator', 'common'])(InvestmentCalculatorForm);
