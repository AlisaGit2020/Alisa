import { Box, Typography, Paper, Alert, Stack, Tooltip } from "@mui/material";
import AssetButton from "../../../asset/form/AssetButton";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useDropzone } from "react-dropzone";
import { TFunction } from "i18next";
import { useCallback, useEffect, useState } from "react";
import { Property } from "@asset-types";
import ApiClient from "@asset-lib/api-client";
import { propertyContext } from "@asset-lib/asset-contexts";
import { SUPPORTED_BANKS, BankId } from "../types";

interface ImportStepProps {
  t: TFunction;
  propertyId: number;
  selectedBank: BankId | null;
  files: File[];
  isUploading: boolean;
  uploadError: string | null;
  skippedCount: number;
  onFilesSelect: (files: File[]) => void;
  onBankSelect: (bank: BankId) => void;
  onUpload: () => Promise<{ savedIds: number[]; skippedCount: number }>;
  onNext: () => void;
  onFetchTransactions: (ids: number[]) => Promise<void>;
}

export default function ImportStep({
  t,
  propertyId,
  selectedBank,
  files,
  isUploading,
  uploadError,
  skippedCount,
  onFilesSelect,
  onBankSelect,
  onUpload,
  onNext,
  onFetchTransactions,
}: ImportStepProps) {
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      if (propertyId > 0) {
        try {
          const result = await ApiClient.get<Property>(
            propertyContext.apiPath,
            propertyId
          );
          setProperty(result);
        } catch {
          setProperty(null);
        }
      } else {
        setProperty(null);
      }
    };
    fetchProperty();
  }, [propertyId]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelect(acceptedFiles);
      }
    },
    [onFilesSelect]
  );

  const isBankSelected = selectedBank !== null;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: true,
    disabled: propertyId <= 0 || !isBankSelected || isUploading,
  });

  const handleUpload = async () => {
    const result = await onUpload();
    if (result.savedIds.length > 0) {
      await onFetchTransactions(result.savedIds);
      onNext();
    } else if (result.skippedCount > 0) {
      // All rows were skipped - still show the info but don't proceed
      // The skippedCount is now in state and can be shown in an alert
    }
  };

  const isPropertySelected = propertyId > 0;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      {/* Bank selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {t("importWizard.selectBank")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("importWizard.selectBankDescription")}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          {SUPPORTED_BANKS.map((bank) => (
            <Tooltip key={bank.id} title={bank.name} arrow>
              <Box
                onClick={() => !isUploading && onBankSelect(bank.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: selectedBank === bank.id ? "primary.light" : "action.hover",
                  border: 2,
                  borderColor: selectedBank === bank.id ? "primary.main" : "transparent",
                  cursor: isUploading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                  "&:hover": {
                    bgcolor: selectedBank === bank.id ? "primary.light" : "action.selected",
                  },
                }}
              >
                <img src={bank.logo} alt={bank.name} style={{ height: 48 }} />
                {selectedBank === bank.id && (
                  <CheckCircleIcon
                    sx={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      color: "primary.main",
                      bgcolor: "background.paper",
                      borderRadius: "50%",
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          ))}
        </Stack>
        {!isBankSelected && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t("importWizard.selectBankWarning")}
          </Alert>
        )}
      </Paper>

      {/* Property display */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {t("importWizard.importingTo")}
        </Typography>
        {isPropertySelected ? (
          <Typography variant="h6">
            {property?.name || t("importWizard.loadingProperty")}
          </Typography>
        ) : (
          <Alert severity="warning">
            {t("importWizard.selectPropertyWarning")}
          </Alert>
        )}
      </Paper>

      {/* Drag & drop zone */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 5,
          border: "2px dashed",
          borderColor: isDragActive
            ? "primary.main"
            : isPropertySelected && isBankSelected
            ? "grey.400"
            : "grey.300",
          bgcolor: isDragActive
            ? "action.hover"
            : isPropertySelected && isBankSelected
            ? "background.paper"
            : "action.disabledBackground",
          cursor: isPropertySelected && isBankSelected && !isUploading ? "pointer" : "not-allowed",
          textAlign: "center",
          transition: "all 0.2s ease",
          opacity: isPropertySelected && isBankSelected ? 1 : 0.6,
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon
          sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
        />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? t("importWizard.dropFileHere")
            : t("importWizard.dragDropOrClick")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("importWizard.csvFilesOnly")}
        </Typography>
      </Paper>

      {/* Selected files display */}
      {files.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            {t("importWizard.selectedFiles", { count: files.length })}:
          </Typography>
          <Stack spacing={1}>
            {files.map((file, index) => (
              <Box key={index} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2">
                  <strong>{file.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(file.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Error display */}
      {uploadError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadError}
        </Alert>
      )}

      {/* Skipped rows info */}
      {skippedCount > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t("importWizard.skippedRows", { count: skippedCount })}
        </Alert>
      )}

      {/* Upload button */}
      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <AssetButton
          label={isUploading ? t("importWizard.uploading") : t("importWizard.uploadAndContinue")}
          variant="contained"
          onClick={handleUpload}
          disabled={files.length === 0 || !isPropertySelected || !isBankSelected || isUploading}
          loading={isUploading}
        />
      </Box>
    </Box>
  );
}
