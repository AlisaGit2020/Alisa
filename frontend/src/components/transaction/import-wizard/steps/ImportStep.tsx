import { Box, Typography, Paper, Alert, CircularProgress, Button, Stack } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useDropzone } from "react-dropzone";
import { TFunction } from "i18next";
import { useCallback, useEffect, useState } from "react";
import { Property } from "@alisa-types";
import ApiClient from "@alisa-lib/api-client";
import { propertyContext } from "@alisa-lib/alisa-contexts";
interface SupportedBank {
  id: string;
  name: string;
  logo: string;
}

const supportedBanks: SupportedBank[] = [
  {
    id: "op",
    name: "Osuuspankki (OP)",
    logo: "/assets/banks/op-logo.svg",
  },
];

interface ImportStepProps {
  t: TFunction;
  propertyId: number;
  files: File[];
  isUploading: boolean;
  uploadError: string | null;
  onFilesSelect: (files: File[]) => void;
  onUpload: () => Promise<number[]>;
  onNext: () => void;
  onFetchTransactions: (ids: number[]) => Promise<void>;
}

export default function ImportStep({
  t,
  propertyId,
  files,
  isUploading,
  uploadError,
  onFilesSelect,
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: true,
    disabled: propertyId <= 0 || isUploading,
  });

  const handleUpload = async () => {
    const ids = await onUpload();
    if (ids.length > 0) {
      await onFetchTransactions(ids);
      onNext();
    }
  };

  const isPropertySelected = propertyId > 0;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      {/* Supported banks */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {t("importWizard.supportedBanks")}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          {supportedBanks.map((bank) => (
            <Box
              key={bank.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: 1,
                bgcolor: "action.hover",
              }}
            >
              <img src={bank.logo} alt={bank.name} width={48} height={48} />
              <Typography variant="body1">{bank.name}</Typography>
            </Box>
          ))}
        </Stack>
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
            : isPropertySelected
            ? "grey.400"
            : "grey.300",
          bgcolor: isDragActive
            ? "action.hover"
            : isPropertySelected
            ? "background.paper"
            : "action.disabledBackground",
          cursor: isPropertySelected && !isUploading ? "pointer" : "not-allowed",
          textAlign: "center",
          transition: "all 0.2s ease",
          opacity: isPropertySelected ? 1 : 0.6,
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

      {/* Upload button */}
      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={files.length === 0 || !isPropertySelected || isUploading}
          startIcon={isUploading ? <CircularProgress size={20} /> : undefined}
        >
          {isUploading ? t("importWizard.uploading") : t("importWizard.uploadAndContinue")}
        </Button>
      </Box>
    </Box>
  );
}
