import { Box, Collapse } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import PropertySummaryCards from "./PropertySummaryCards";
import PropertyReportCharts from "./PropertyReportCharts";
import { PropertyStatistics } from "@asset-types";
import ApiClient from "@asset-lib/api-client";
import { VITE_API_URL } from "../../../constants";
import axios from "axios";
import { calculateSummaryData } from "./report-utils";
import { useAssetToast } from "../../asset/toast";

interface PropertyReportSectionProps {
  propertyId: number;
  showAdvancedReports?: boolean;
}

function PropertyReportSection({ propertyId, showAdvancedReports = false }: PropertyReportSectionProps) {
  const { t } = useTranslation("property");
  const { showToast } = useAssetToast();
  const [statistics, setStatistics] = useState<PropertyStatistics[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  // Fetch statistics for summary cards (current year + all-time)
  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const url = `${VITE_API_URL}/real-estate/property/${propertyId}/statistics/search`;
        const options = await ApiClient.getOptions();
        // Fetch both yearly and monthly stats
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

    if (propertyId) {
      fetchStatistics();
    }
  }, [propertyId, showToast, t]);

  // Calculate summary values
  const summaryData = useMemo(
    () => calculateSummaryData(statistics, currentYear),
    [statistics, currentYear]
  );

  return (
    <Box>
      {/* Summary Cards */}
      <PropertySummaryCards
        currentYearIncome={summaryData.currentYearIncome}
        currentYearExpenses={summaryData.currentYearExpenses}
        allTimeBalance={summaryData.allTimeBalance}
        allTimeNetIncome={summaryData.allTimeNetIncome}
        loading={loading}
      />

      {/* Collapsible Charts Section - controlled by parent via showAdvancedReports prop */}
      <Collapse in={showAdvancedReports} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 3 }}>
          <PropertyReportCharts propertyId={propertyId} />
        </Box>
      </Collapse>
    </Box>
  );
}

export default PropertyReportSection;
