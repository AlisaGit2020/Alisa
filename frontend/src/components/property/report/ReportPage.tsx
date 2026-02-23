import { useState, useEffect, useMemo } from "react";
import { Box, Typography, Paper, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import PropertySummaryCards from "./PropertySummaryCards";
import PropertyReportCharts from "./PropertyReportCharts";
import PageHeader from "../../templates/PageHeader";
import { PropertyStatistics } from "@asset-types";
import ApiClient from "@asset-lib/api-client";
import { VITE_API_URL } from "../../../constants";
import axios from "axios";
import { getTransactionPropertyId } from "@asset-lib/initial-data";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../../transaction/TransactionLeftMenuItems";
import { calculateSummaryData } from "./report-utils";
import { useToast } from "../../asset/toast";

function ReportPage() {
  const { t } = useTranslation("property");
  const { showToast } = useToast();

  const [propertyId, setPropertyId] = useState<number>(() =>
    getTransactionPropertyId()
  );
  const [statistics, setStatistics] = useState<PropertyStatistics[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  // Listen for global property changes from AppBar
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

  // Calculate summary values
  const summaryData = useMemo(
    () => calculateSummaryData(statistics, currentYear),
    [statistics, currentYear]
  );

  return (
    <Box>
      <PageHeader
        translationPrefix="property"
        titleKey="report.advancedReports"
      />

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
