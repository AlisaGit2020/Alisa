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

interface BreakdownItem {
  category: string;
  amount: number;
  isTaxDeductible: boolean;
  isCapitalImprovement?: boolean;
  depreciationAmount?: number;
}

interface TaxData {
  year: number;
  propertyId?: number;
  grossIncome: number;
  deductions: number;
  depreciation: number;
  netIncome: number;
  breakdown: BreakdownItem[];
  calculatedAt?: string;
}

function TaxView() {
  const { t } = useTranslation("tax");

  const currentYear = new Date().getFullYear();
  const defaultYear = currentYear - 1;

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [taxData, setTaxData] = useState<TaxData | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 1 - i);

  const fetchTaxData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<TaxData>(
        `${VITE_API_URL}/real-estate/property/tax?year=${selectedYear}`,
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
  }, [selectedYear]);

  const calculateTaxData = async () => {
    setCalculating(true);
    setError(null);
    try {
      const response = await axios.post<TaxData>(
        `${VITE_API_URL}/real-estate/property/tax/calculate`,
        { year: selectedYear },
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
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h4">{t("title")}</Typography>
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

      <Alert severity="info" sx={{ mb: 3 }}>
        {t("infoText")}
      </Alert>

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
          />
        </>
      )}
    </Box>
  );
}

export default TaxView;
