import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import AlisaButton from "../form/AlisaButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useTranslation } from "react-i18next";
import { DeleteValidationResult, DependencyType } from "@alisa-types";

interface AlisaDependencyDialogProps {
  open: boolean;
  validationResult: DeleteValidationResult | null;
  onClose: () => void;
  onConfirmDelete: () => void;
}

function AlisaDependencyDialog({
  open,
  validationResult,
  onClose,
  onConfirmDelete,
}: AlisaDependencyDialogProps) {
  const { t } = useTranslation();

  const getDependencyLabel = (type: DependencyType): string => {
    const labels: Record<DependencyType, string> = {
      transaction: t("common:dependencies.transactions"),
      expense: t("common:dependencies.expenses"),
      income: t("common:dependencies.incomes"),
      statistics: t("common:dependencies.statistics"),
      depreciationAsset: t("common:dependencies.depreciationAssets"),
    };
    return labels[type];
  };

  if (!validationResult) {
    return null;
  }

  const handleConfirmDelete = () => {
    onConfirmDelete();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningAmberIcon color="warning" />
        {t("common:dependencies.deleteWarningTitle")}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t("common:dependencies.deleteWarning")}
        </Typography>
        {validationResult.dependencies.map((group) => (
          <Accordion key={group.type} defaultExpanded={false}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${group.type}-content`}
              id={`${group.type}-header`}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Typography>{getDependencyLabel(group.type)}</Typography>
                <Chip
                  label={group.count}
                  size="small"
                  color="warning"
                  data-testid={`${group.type}-count`}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense disablePadding>
                {group.samples.map((item) => (
                  <ListItem key={item.id} disableGutters>
                    <ListItemText
                      primary={item.description}
                      secondary={`ID: ${item.id}`}
                    />
                  </ListItem>
                ))}
                {group.count > group.samples.length && (
                  <ListItem disableGutters>
                    <ListItemText
                      primary={t("common:dependencies.andMore", {
                        count: group.count - group.samples.length,
                      })}
                      primaryTypographyProps={{
                        fontStyle: "italic",
                        color: "text.secondary",
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </DialogContent>
      <DialogActions>
        <AlisaButton
          label={t("common:cancel")}
          onClick={onClose}
          variant="outlined"
        />
        <AlisaButton
          label={t("common:dependencies.deleteConfirm")}
          onClick={handleConfirmDelete}
          variant="contained"
          color="error"
        />
      </DialogActions>
    </Dialog>
  );
}

export default AlisaDependencyDialog;
