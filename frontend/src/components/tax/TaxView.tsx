import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import { useTranslation } from "react-i18next";
import axios from "axios";
import ApiClient from "@alisa-lib/api-client";
import { VITE_API_URL } from "../../constants";
import TaxSummaryCards from "./TaxSummaryCards";
import TaxBreakdown from "./TaxBreakdown";
import { ListPageTemplate } from "../templates";
import { getTransactionPropertyId } from "@alisa-lib/initial-data";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../transaction/TransactionLeftMenuItems";

interface BreakdownItem {
  category: string;
  amount: number;
  isTaxDeductible: boolean;
  isCapitalImprovement?: boolean;
  depreciationAmount?: number;
}

interface DepreciationAssetBreakdown {
  assetId: number;
  expenseId: number;
  description: string;
  acquisitionYear: number;
  acquisitionMonth?: number;
  originalAmount: number;
  depreciationAmount: number;
  remainingAmount: number;
  yearsRemaining: number;
  isFullyDepreciated: boolean;
}

interface TaxData {
  year: number;
  propertyId?: number;
  ownershipShare?: number;
  grossIncome: number;
  deductions: number;
  depreciation: number;
  netIncome: number;
  breakdown: BreakdownItem[];
  depreciationBreakdown?: DepreciationAssetBreakdown[];
  calculatedAt?: string;
}

function TaxView() {
  const { t } = useTranslation("tax");

  const currentYear = new Date().getFullYear();
  const defaultYear = currentYear - 1;

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [propertyId, setPropertyId] = useState<number>(() =>
    getTransactionPropertyId()
  );
  const [taxData, setTaxData] = useState<TaxData | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 1 - i);

  // Listen for global property changes
  useEffect(() => {
    const handlePropertyChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ propertyId: number }>;
      setPropertyId(customEvent.detail.propertyId);
    };

    window.addEventListener(
      TRANSACTION_PROPERTY_CHANGE_EVENT,
      handlePropertyChange
    );

    return () => {
      window.removeEventListener(
        TRANSACTION_PROPERTY_CHANGE_EVENT,
        handlePropertyChange
      );
    };
  }, []);

  const fetchTaxData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ year: selectedYear.toString() });
      if (propertyId > 0) {
        params.append("propertyId", propertyId.toString());
      }
      const response = await axios.get<TaxData>(
        `${VITE_API_URL}/real-estate/property/tax?${params.toString()}`,
        await ApiClient.getOptions()
      );
      if (response.data) {
        setTaxData(response.data);
      } else {
        setTaxData(null);
      }
    } catch (err) {
      console.error("Error fetching tax data:", err);
      setTaxData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, propertyId]);

  const calculateTaxData = async () => {
    setCalculating(true);
    setError(null);
    try {
      const body: { year: number; propertyId?: number } = { year: selectedYear };
      if (propertyId > 0) {
        body.propertyId = propertyId;
      }
      const response = await axios.post<TaxData>(
        `${VITE_API_URL}/real-estate/property/tax/calculate`,
        body,
        await ApiClient.getOptions()
      );
      setTaxData(response.data);
    } catch (err) {
      console.error("Error calculating tax data:", err);
      setError(t("calculateError"));
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchTaxData();
  }, [fetchTaxData]);

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(event.target.value as number);
  };

  return (
    <ListPageTemplate translationPrefix="tax">
      <Stack
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="tax-year-select">{t("year")}</InputLabel>
          <Select
            labelId="tax-year-select"
            value={selectedYear}
            label={t("year")}
            onChange={handleYearChange}
          >
            {yearOptions.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !taxData && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary" gutterBottom>
            {t("noData")}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
            {t("noDataHint")}
          </Typography>
          <Button
            variant="contained"
            startIcon={
              calculating ? <CircularProgress size={20} /> : <CalculateIcon />
            }
            onClick={calculateTaxData}
            disabled={calculating}
          >
            {calculating ? t("calculating") : t("calculate")}
          </Button>
        </Paper>
      )}

      {!loading && taxData && (
        <>
          <TaxSummaryCards
            grossIncome={taxData.grossIncome}
            deductions={taxData.deductions}
            depreciation={taxData.depreciation}
            netIncome={taxData.netIncome}
          />
          {taxData.ownershipShare !== undefined && taxData.ownershipShare < 100 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t("ownershipShare")}: {taxData.ownershipShare}%
            </Alert>
          )}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={
                calculating ? <CircularProgress size={20} /> : <CalculateIcon />
              }
              onClick={calculateTaxData}
              disabled={calculating}
            >
              {calculating ? t("calculating") : t("calculate")}
            </Button>
          </Box>
          <TaxBreakdown
            grossIncome={taxData.grossIncome}
            deductions={taxData.deductions}
            depreciation={taxData.depreciation}
            netIncome={taxData.netIncome}
            breakdown={taxData.breakdown}
            depreciationBreakdown={taxData.depreciationBreakdown}
          />
        </>
      )}
    </ListPageTemplate>
  );
}

export default TaxView;
