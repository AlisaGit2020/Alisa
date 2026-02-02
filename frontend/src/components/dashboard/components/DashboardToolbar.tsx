import { Fab, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";
import { useDashboard } from "../context/DashboardContext";

export function DashboardToolbar() {
  const { t } = useTranslation("dashboard");
  const { isEditMode, setIsEditMode, saveDashboardConfig } = useDashboard();

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleDoneClick = async () => {
    await saveDashboardConfig();
    setIsEditMode(false);
  };

  const fabStyle = {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 1000,
  };

  if (!isEditMode) {
    return (
      <Box sx={fabStyle}>
        <Fab
          color="primary"
          aria-label={t("editDashboard")}
          onClick={handleEditClick}
          size="medium"
        >
          <EditIcon />
        </Fab>
      </Box>
    );
  }

  return (
    <Box sx={fabStyle}>
      <Fab
        color="success"
        aria-label={t("doneEditing")}
        onClick={handleDoneClick}
        size="medium"
        sx={{ color: "white" }}
      >
        <CheckIcon />
      </Fab>
    </Box>
  );
}
