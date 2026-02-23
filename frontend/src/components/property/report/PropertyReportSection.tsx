import { Box, Collapse } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PropertySummaryCards from "./PropertySummaryCards";
import PropertyReportCharts from "./PropertyReportCharts";
import AssetButton from "../../asset/form/AssetButton";
import { PropertyStatistics } from "@asset-types";
import ApiClient from "@asset-lib/api-client";
import { VITE_API_URL } from "../../../constants";
import axios from "axios";
import { calculateSummaryData } from "./report-utils";
import { useAssetToast } from "../../asset/toast";

interface PropertyReportSectionProps {
  propertyId: number;
}

function PropertyReportSection({ propertyId }: PropertyReportSectionProps) {
  const { t } = useTranslation("property");
  const { showToast } = useAssetToast();
  const [expanded, setExpanded] = useState(false);
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

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

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

      {/* Advanced Reports Toggle Button */}
      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
        <AssetButton
          label={t("report.advancedReports")}
          variant="outlined"
          startIcon={<AssessmentIcon />}
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={handleToggle}
        />
      </Box>

      {/* Collapsible Charts Section */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 3 }}>
          <PropertyReportCharts propertyId={propertyId} />
        </Box>
      </Collapse>
    </Box>
  );
}

export default PropertyReportSection;
