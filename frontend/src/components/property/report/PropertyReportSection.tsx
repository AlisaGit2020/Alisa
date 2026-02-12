import { Box, Collapse } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PropertySummaryCards from "./PropertySummaryCards";
import PropertyReportCharts from "./PropertyReportCharts";
import AlisaButton from "../../alisa/form/AlisaButton";
import { PropertyStatistics } from "@alisa-types";
import ApiClient from "@alisa-lib/api-client";
import { VITE_API_URL } from "../../../constants";
import axios from "axios";

interface PropertyReportSectionProps {
  propertyId: number;
}

function PropertyReportSection({ propertyId }: PropertyReportSectionProps) {
  const { t } = useTranslation("property");
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
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchStatistics();
    }
  }, [propertyId]);

  // Calculate summary values
  const summaryData = useMemo(() => {
    let currentYearIncome = 0;
    let currentYearExpenses = 0;
    let allTimeIncome = 0;
    let allTimeExpenses = 0;
    let allTimeDeposit = 0;
    let allTimeWithdraw = 0;

    statistics.forEach((stat) => {
      const value = parseFloat(stat.value) || 0;

      // All-time totals (yearly stats without month)
      if (stat.year && !stat.month) {
        if (stat.key === "income") {
          allTimeIncome += value;
        } else if (stat.key === "expense") {
          allTimeExpenses += value;
        } else if (stat.key === "deposit") {
          allTimeDeposit += value;
        } else if (stat.key === "withdraw") {
          allTimeWithdraw += value;
        }

        // Current year
        if (stat.year === currentYear) {
          if (stat.key === "income") {
            currentYearIncome += value;
          } else if (stat.key === "expense") {
            currentYearExpenses += value;
          }
        }
      }
    });

    // Balance = all income + deposits - expenses - withdrawals
    const allTimeBalance =
      allTimeIncome + allTimeDeposit - allTimeExpenses - allTimeWithdraw;
    const allTimeNetIncome = allTimeIncome - allTimeExpenses;

    return {
      currentYearIncome,
      currentYearExpenses,
      allTimeBalance,
      allTimeNetIncome,
    };
  }, [statistics, currentYear]);

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
        <AlisaButton
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
