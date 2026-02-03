import { useState } from "react";
import { Fab, Box, CircularProgress, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";
import { useDashboard } from "../context/DashboardContext";
import ApiClient from "@alisa-lib/api-client";
import axios from "axios";
import { VITE_API_URL } from "../../../constants";

export function DashboardToolbar() {
  const { t } = useTranslation("dashboard");
  const { isEditMode, setIsEditMode, saveDashboardConfig, refreshData } = useDashboard();
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleDoneClick = async () => {
    await saveDashboardConfig();
    setIsEditMode(false);
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const options = await ApiClient.getOptions();
      await axios.post(
        `${VITE_API_URL}/real-estate/property/statistics/recalculate`,
        {},
        options
      );
      // Refresh the dashboard data after recalculation
      refreshData();
    } catch (error) {
      console.error("Failed to recalculate statistics:", error);
    } finally {
      setIsRecalculating(false);
    }
  };

  const fabContainerStyle = {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: 1,
  };

  if (!isEditMode) {
    return (
      <Box sx={fabContainerStyle}>
        <Tooltip title={t("recalculate")} placement="left">
          <span>
            <Fab
              color="secondary"
              aria-label={t("recalculate")}
              onClick={handleRecalculate}
              size="small"
              disabled={isRecalculating}
            >
              {isRecalculating ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <RefreshIcon />
              )}
            </Fab>
          </span>
        </Tooltip>
        <Tooltip title={t("editDashboard")} placement="left">
          <Fab
            color="primary"
            aria-label={t("editDashboard")}
            onClick={handleEditClick}
            size="medium"
          >
            <EditIcon />
          </Fab>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={fabContainerStyle}>
      <Tooltip title={t("doneEditing")} placement="left">
        <Fab
          color="success"
          aria-label={t("doneEditing")}
          onClick={handleDoneClick}
          size="medium"
          sx={{ color: "white" }}
        >
          <CheckIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}
