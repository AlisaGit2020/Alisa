import { useState, useEffect } from "react";
import { Box, Typography, Paper, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PropertySummaryCards from "./PropertySummaryCards";
import PropertyReportCharts from "./PropertyReportCharts";
import AlisaButton from "../../alisa/form/AlisaButton";
import AlisaPropertySelect from "../../alisa/data/AlisaPropertySelect";
import { ListPageTemplate } from "../../templates";
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

function ReportPage() {
  const { t } = useTranslation("property");
  const navigate = useNavigate();

  const [propertyId, setPropertyId] = useState<number>(() =>
    getTransactionPropertyId()
  );
  const [property, setProperty] = useState<Property | null>(null);
  const [statistics, setStatistics] = useState<PropertyStatistics[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

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

  // Fetch property details
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId || propertyId <= 0) {
        setProperty(null);
        setLoading(false);
        return;
      }

      try {
        const data = await ApiClient.get<Property>(
          propertyContext.apiPath,
          propertyId
        );
        setProperty(data);
      } catch (error) {
        console.error("Failed to fetch property:", error);
        setProperty(null);
      }
    };

    fetchProperty();
  }, [propertyId]);

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
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [propertyId]);

  const handlePropertyChange = (newPropertyId: number) => {
    setPropertyId(newPropertyId);
    setTransactionPropertyId(newPropertyId);
    // Dispatch event for other components
    window.dispatchEvent(
      new CustomEvent(TRANSACTION_PROPERTY_CHANGE_EVENT, {
        detail: { propertyId: newPropertyId },
      })
    );
  };

  const handleBackToProperty = () => {
    if (propertyId && propertyId > 0) {
      navigate(`${propertyContext.routePath}/${propertyId}`);
    } else {
      navigate(propertyContext.routePath);
    }
  };

  // Calculate summary values
  const summaryData = (() => {
    let currentYearIncome = 0;
    let currentYearExpenses = 0;
    let allTimeIncome = 0;
    let allTimeExpenses = 0;
    let allTimeDeposit = 0;
    let allTimeWithdraw = 0;

    statistics.forEach((stat) => {
      const value = parseFloat(stat.value) || 0;

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

        if (stat.year === currentYear) {
          if (stat.key === "income") {
            currentYearIncome += value;
          } else if (stat.key === "expense") {
            currentYearExpenses += value;
          }
        }
      }
    });

    const allTimeBalance =
      allTimeIncome + allTimeDeposit - allTimeExpenses - allTimeWithdraw;
    const allTimeNetIncome = allTimeIncome - allTimeExpenses;

    return {
      currentYearIncome,
      currentYearExpenses,
      allTimeBalance,
      allTimeNetIncome,
    };
  })();

  const headerActions = (
    <Stack direction="row" spacing={2} alignItems="center">
      <AlisaPropertySelect
        value={propertyId}
        onChange={handlePropertyChange}
        size="small"
      />
    </Stack>
  );

  return (
    <ListPageTemplate
      title={t("report.advancedReports")}
      description={property?.name}
      icon={<AssessmentIcon />}
      actions={headerActions}
    >
      <Box sx={{ mb: 2 }}>
        <AlisaButton
          label={t("report.backToProperty")}
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToProperty}
        />
      </Box>

      {!propertyId || propertyId <= 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            {t("report.selectProperty")}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {/* Summary Cards */}
          <PropertySummaryCards
            currentYearIncome={summaryData.currentYearIncome}
            currentYearExpenses={summaryData.currentYearExpenses}
            allTimeBalance={summaryData.allTimeBalance}
            allTimeNetIncome={summaryData.allTimeNetIncome}
            loading={loading}
          />

          {/* Full Charts Section */}
          <PropertyReportCharts propertyId={propertyId} />
        </Stack>
      )}
    </ListPageTemplate>
  );
}

export default ReportPage;
