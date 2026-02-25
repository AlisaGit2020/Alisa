import { useState, ChangeEvent } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
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
import AssetTextField from "../asset/form/AssetTextField";
import AssetButton from "../asset/form/AssetButton";
import { useToast } from "../asset/toast";
import ApiClient from "@asset-lib/api-client";

interface ProspectAddChoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onManualAdd: () => void;
}

const ETUOVI_URL_PATTERN = /^https?:\/\/(www\.)?etuovi\.com\/kohde\/\d+/;

export default function ProspectAddChoiceDialog({
  open,
  onClose,
  onSuccess,
  onManualAdd,
}: ProspectAddChoiceDialogProps) {
  const { t } = useTranslation("property");
  const { showToast } = useToast();
  const [etuoviUrl, setEtuoviUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEtuoviUrl(e.target.value);
    setValidationError(undefined);
  };

  const validateUrl = (url: string): boolean => {
    if (!ETUOVI_URL_PATTERN.test(url)) {
      setValidationError(t("invalidEtuoviUrl"));
      return false;
    }
    return true;
  };

  const handleImport = async () => {
    if (!validateUrl(etuoviUrl)) {
      return;
    }

    setLoading(true);
    try {
      await ApiClient.post("import/etuovi/create-prospect", { url: etuoviUrl });
      showToast({ message: t("importSuccess"), severity: "success" });
      setEtuoviUrl("");
      onSuccess();
    } catch {
      showToast({ message: t("importError"), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEtuoviUrl("");
    setValidationError(undefined);
    onClose();
  };

  const isImportDisabled = !etuoviUrl.trim() || loading;

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
          {/* Etuovi Import Option */}
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <HomeIcon color="primary" />
                <Typography variant="h6">{t("importFromEtuovi")}</Typography>
              </Stack>
              <Stack spacing={2}>
                <AssetTextField
                  label=""
                  placeholder={t("etuoviUrlPlaceholder")}
                  value={etuoviUrl}
                  onChange={handleUrlChange}
                  error={!!validationError}
                  helperText={validationError}
                  disabled={loading}
                  fullWidth
                />
                <Box>
                  <AssetButton
                    label={loading ? "" : t("importButton")}
                    onClick={handleImport}
                    disabled={isImportDisabled}
                    startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  />
                </Box>
              </Stack>
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
