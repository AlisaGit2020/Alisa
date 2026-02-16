import { IconButton, Tooltip } from "@mui/material";
import FeedbackIcon from "@mui/icons-material/Feedback";
import { useTranslation } from "react-i18next";
import React from "react";
import FeedbackDialog from "../feedback/FeedbackDialog";

export default function FeedbackMenuButton() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <>
      <Tooltip title={t("common:feedback.title")}>
        <IconButton color="inherit" onClick={() => setDialogOpen(true)}>
          <FeedbackIcon />
        </IconButton>
      </Tooltip>
      <FeedbackDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
