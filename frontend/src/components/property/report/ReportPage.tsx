import { useState, useEffect, useMemo } from "react";
import { Box, Typography, Paper, Stack, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PropertySummaryCards from "./PropertySummaryCards";
import PropertyReportCharts from "./PropertyReportCharts";
import AlisaButton from "../../alisa/form/AlisaButton";
import PageHeader from "../../templates/PageHeader";
import { Property, PropertyStatistics } from "@alisa-types";
import ApiClient from "@alisa-lib/api-client";
import { VITE_API_URL } from "../../../constants";
import axios from "axios";
import {
  getTransactionPropertyId,
  setTransactionPropertyId,
} from "@alisa-lib/initial-data";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../../transaction/TransactionLeftMenuItems";
import { propertyContext } from "@alisa-lib/alisa-contexts";
import { calculateSummaryData } from "./report-utils";
import { useToast } from "../../alisa/toast";

function ReportPage() {
  const { t } = useTranslation("property");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [propertyId, setPropertyId] = useState<number>(() =>
    getTransactionPropertyId()
  );
  const [properties, setProperties] = useState<Property[]>([]);
  const [statistics, setStatistics] = useState<PropertyStatistics[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  // Fetch properties list
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const url = `${VITE_API_URL}/real-estate/property/search`;
        const options = await ApiClient.getOptions();
        const response = await axios.post<Property[]>(
          url,
          { select: ["id", "name"], order: { name: "ASC" } },
          options
        );
        setProperties(response.data);
        // If no property selected, select the first one
        if ((!propertyId || propertyId <= 0) && response.data.length > 0) {
          handlePropertyChange(response.data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch properties:", error);
        showToast({ message: t("report.fetchError"), severity: "error" });
      }
    };

    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for global property changes
  useEffect(() => {
    const handlePropertyChangeEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ propertyId: number }>;
      setPropertyId(customEvent.detail.propertyId);
    };

    window.addEventListener(
      TRANSACTION_PROPERTY_CHANGE_EVENT,
      handlePropertyChangeEvent
    );
    return () => {
      window.removeEventListener(
        TRANSACTION_PROPERTY_CHANGE_EVENT,
        handlePropertyChangeEvent
      );
    };
  }, []);

  // Fetch statistics for summary cards
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!propertyId || propertyId <= 0) {
        setStatistics([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const url = `${VITE_API_URL}/real-estate/property/${propertyId}/statistics/search`;
        const options = await ApiClient.getOptions();
        const response = await axios.post<PropertyStatistics[]>(
          url,
          { includeYearly: true },
          options
        );
        setStatistics(response.data);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
        setStatistics([]);
        showToast({ message: t("report.fetchError"), severity: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [propertyId, showToast, t]);

  const handlePropertyChange = (newPropertyId: number) => {
    setPropertyId(newPropertyId);
    setTransactionPropertyId(newPropertyId);
    window.dispatchEvent(
      new CustomEvent(TRANSACTION_PROPERTY_CHANGE_EVENT, {
        detail: { propertyId: newPropertyId },
      })
    );
  };

  const handleSelectChange = (event: SelectChangeEvent<number>) => {
    handlePropertyChange(event.target.value as number);
  };

  const handleBackToProperty = () => {
    if (propertyId && propertyId > 0) {
      navigate(`${propertyContext.routePath}/${propertyId}`);
    } else {
      navigate(propertyContext.routePath);
    }
  };

  // Calculate summary values
  const summaryData = useMemo(
    () => calculateSummaryData(statistics, currentYear),
    [statistics, currentYear]
  );

  const selectedProperty = properties.find((p) => p.id === propertyId);

  return (
    <Box>
      <PageHeader
        translationPrefix="property"
        titleKey="report.advancedReports"
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <AlisaButton
          label={t("report.backToProperty")}
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToProperty}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t("properties")}</InputLabel>
          <Select
            value={propertyId || ""}
            label={t("properties")}
            onChange={handleSelectChange}
          >
            {properties.map((property) => (
              <MenuItem key={property.id} value={property.id}>
                {property.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedProperty && (
        <Typography variant="h6" gutterBottom>
          {selectedProperty.name}
        </Typography>
      )}

      {!propertyId || propertyId <= 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            {t("report.selectProperty")}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          <PropertySummaryCards
            currentYearIncome={summaryData.currentYearIncome}
            currentYearExpenses={summaryData.currentYearExpenses}
            allTimeBalance={summaryData.allTimeBalance}
            allTimeNetIncome={summaryData.allTimeNetIncome}
            loading={loading}
          />

          <PropertyReportCharts propertyId={propertyId} />
        </Stack>
      )}
    </Box>
  );
}

export default ReportPage;
