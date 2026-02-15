import { Fab, Tooltip } from "@mui/material";
import FeedbackIcon from "@mui/icons-material/Feedback";
import { useTranslation } from "react-i18next";
import React from "react";
import FeedbackDialog from "./FeedbackDialog";

export default function FeedbackButton() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <>
      <Tooltip title={t('common:feedback.title')} placement="left">
        <Fab
          color="primary"
          aria-label={t('common:feedback.title')}
          onClick={() => setDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: (theme) => theme.zIndex.speedDial,
          }}
        >
          <FeedbackIcon />
        </Fab>
      </Tooltip>
      <FeedbackDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
