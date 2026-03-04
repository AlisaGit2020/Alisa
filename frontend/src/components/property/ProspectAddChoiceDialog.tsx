import {
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";
import ListingImportInput from "./ListingImportInput";

interface ProspectAddChoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onManualAdd: () => void;
}

export default function ProspectAddChoiceDialog({
  open,
  onClose,
  onSuccess,
  onManualAdd,
}: ProspectAddChoiceDialogProps) {
  const { t } = useTranslation("property");

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="prospect-add-dialog-title"
    >
      <DialogTitle id="prospect-add-dialog-title">
        {t("addProspectTitle")}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 3 }}>{t("chooseAddMethod")}</Typography>

        <Stack spacing={2}>
          {/* Listing Import Option */}
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <HomeIcon color="primary" />
                <Typography variant="h6">{t("importFromListing")}</Typography>
              </Stack>
              <ListingImportInput
                mode="prospect"
                onSuccess={onSuccess}
                showRentInput={true}
              />
            </CardContent>
          </Card>

          {/* Manual Add Option */}
          <Card variant="outlined">
            <CardActionArea onClick={onManualAdd}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EditIcon color="primary" />
                  <Typography variant="h6">{t("addManually")}</Typography>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
