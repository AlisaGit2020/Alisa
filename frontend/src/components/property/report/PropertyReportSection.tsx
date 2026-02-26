import { Box, Collapse } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import PropertySummaryCards from "./PropertySummaryCards";
import PropertyReportCharts from "./PropertyReportCharts";
import { PropertyStatistics } from "@asset-types";
import ApiClient from "@asset-lib/api-client";
import { calculateSummaryData } from "./report-utils";
import { useAssetToast } from "../../asset/toast";

interface PropertyReportSectionProps {
  propertyId: number;
  showAdvancedReports?: boolean;
  /** Pre-fetched statistics to avoid duplicate API calls */
  statistics?: PropertyStatistics[];
}

function PropertyReportSection({
  propertyId,
  showAdvancedReports = false,
  statistics: externalStatistics,
}: PropertyReportSectionProps) {
  const { t } = useTranslation("property");
  const { showToast } = useAssetToast();
  const [internalStatistics, setInternalStatistics] = useState<PropertyStatistics[]>([]);
  const [loading, setLoading] = useState(!externalStatistics);

  // Use external statistics if provided, otherwise use internal state
  const statistics = externalStatistics ?? internalStatistics;

  const currentYear = new Date().getFullYear();

  // Only fetch statistics if not provided externally
  useEffect(() => {
    // Skip fetching if statistics are provided externally
    if (externalStatistics) {
      return;
    }

    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const data = await ApiClient.propertyStatistics<PropertyStatistics>(
          propertyId,
          { includeYearly: true }
        );
        setInternalStatistics(data);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
        setInternalStatistics([]);
        showToast({ message: t("report.fetchError"), severity: "error" });
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchStatistics();
    }
  }, [propertyId, externalStatistics, showToast, t]);

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
