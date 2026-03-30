import { useState, useEffect, useCallback, MouseEvent } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  SelectChangeEvent,
  Stack,
  Menu,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import { AssetButton, AssetConfirmDialog } from "../asset";
import axios from "axios";
import ApiClient from "@asset-lib/api-client";
import { VITE_API_URL } from "../../constants";
import TaxSummaryCards from "./TaxSummaryCards";
import TaxBreakdown from "./TaxBreakdown";
import { ListPageTemplate } from "../templates";
import { getTransactionPropertyId } from "@asset-lib/initial-data";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../transaction/TransactionLeftMenuItems";
import { TaxDeductionType } from "../../types/common";
import TaxDeductionDialog from "./TaxDeductionDialog";
import type { Property } from "../../types/entities";

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

interface TaxDeductionBreakdown {
  id: number;
  type: number;
  typeName: string;
  description: string | null;
  amount: number;
  metadata?: {
    distanceKm?: number;
    visits?: number;
    ratePerKm?: number;
    pricePerLaundry?: number;
  };
}

interface TaxData {
  year: number;
  propertyId?: number;
  ownershipShare?: number;
  grossIncome: number;
  deductions: number;
  taxDeductions?: number;
  depreciation: number;
  netIncome: number;
  breakdown: BreakdownItem[];
  taxDeductionBreakdown?: TaxDeductionBreakdown[];
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
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [dialogType, setDialogType] = useState<TaxDeductionType | null>(null);
  const [isAirbnbProperty, setIsAirbnbProperty] = useState(false);
  const [deleteDeductionId, setDeleteDeductionId] = useState<number | null>(null);

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

  const fetchPropertyData = useCallback(async () => {
    if (propertyId > 0) {
      try {
        const property = await ApiClient.get<Property>('real-estate/property', propertyId);
        setIsAirbnbProperty(property.isAirbnb || false);
      } catch (err) {
        console.error("Error fetching property data:", err);
        setIsAirbnbProperty(false);
      }
    } else {
      setIsAirbnbProperty(false);
    }
  }, [propertyId]);

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

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleDeductionSelect = (type: TaxDeductionType) => {
    setDialogType(type);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setDialogType(null);
  };

  const handleDeductionSaved = () => {
    fetchTaxData();
  };

  const handleDeleteDeduction = (id: number) => {
    setDeleteDeductionId(id);
  };

  const confirmDeleteDeduction = async () => {
    if (deleteDeductionId === null) return;
    try {
      await axios.delete(
        `${VITE_API_URL}/real-estate/property/tax/deductions/${deleteDeductionId}`,
        await ApiClient.getOptions()
      );
      fetchTaxData();
    } catch (err) {
      console.error("Error deleting deduction:", err);
    } finally {
      setDeleteDeductionId(null);
    }
  };

  useEffect(() => {
    fetchTaxData();
    fetchPropertyData();
  }, [fetchTaxData, fetchPropertyData]);

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
          <AssetButton
            label={calculating ? t("calculating") : t("calculate")}
            startIcon={<CalculateIcon />}
            onClick={calculateTaxData}
            loading={calculating}
          />
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
          <Stack direction="row" spacing={2} sx={{ mt: 3, mb: 2 }}>
            <AssetButton
              label={calculating ? t("calculating") : t("calculate")}
              variant="outlined"
              startIcon={<CalculateIcon />}
              onClick={calculateTaxData}
              loading={calculating}
            />
            {propertyId > 0 && (
              <>
                <AssetButton
                  label={t("addTaxDeduction")}
                  startIcon={<AddIcon />}
                  onClick={handleMenuOpen}
                  variant="contained"
                />
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={handleMenuClose}
                >
                  {isAirbnbProperty && (
                    <>
                      <MenuItem onClick={() => handleDeductionSelect(TaxDeductionType.TRAVEL)}>
                        {t("travelExpenses")}
                      </MenuItem>
                      <MenuItem onClick={() => handleDeductionSelect(TaxDeductionType.LAUNDRY)}>
                        {t("laundryExpenses")}
                      </MenuItem>
                    </>
                  )}
                  <MenuItem onClick={() => handleDeductionSelect(TaxDeductionType.CUSTOM)}>
                    {t("customDeduction")}
                  </MenuItem>
                </Menu>
              </>
            )}
          </Stack>
          <TaxBreakdown
            grossIncome={taxData.grossIncome}
            deductions={taxData.deductions}
            taxDeductions={taxData.taxDeductions}
            depreciation={taxData.depreciation}
            netIncome={taxData.netIncome}
            breakdown={taxData.breakdown}
            taxDeductionBreakdown={taxData.taxDeductionBreakdown}
            depreciationBreakdown={taxData.depreciationBreakdown}
            onDeleteDeduction={handleDeleteDeduction}
          />
        </>
      )}

      {dialogType !== null && propertyId > 0 && (
        <TaxDeductionDialog
          open={dialogType !== null}
          onClose={handleDialogClose}
          onSaved={handleDeductionSaved}
          propertyId={propertyId}
          year={selectedYear}
          deductionType={dialogType}
        />
      )}

      <AssetConfirmDialog
        open={deleteDeductionId !== null}
        title={t("deleteDeduction")}
        contentText={t("deleteDeductionConfirm")}
        buttonTextCancel={t("common:cancel")}
        buttonTextConfirm={t("common:delete")}
        onConfirm={confirmDeleteDeduction}
        onClose={() => setDeleteDeductionId(null)}
      />
    </ListPageTemplate>
  );
}

export default TaxView;
