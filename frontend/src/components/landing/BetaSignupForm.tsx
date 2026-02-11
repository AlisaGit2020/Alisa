import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, Stack, Alert } from "@mui/material";
import { AlisaButton, AlisaTextField, useToast } from "../alisa";
import ApiClient from "@alisa-lib/api-client";
import axios from "axios";

export default function BetaSignupForm() {
  const { t } = useTranslation("landing");
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      await ApiClient.post("beta/signup", { email }, true);
      setIsSuccess(true);
      setEmail("");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        showToast({
          message: t("betaErrorDuplicate"),
          severity: "warning",
        });
      } else {
        showToast({
          message: t("betaErrorGeneric"),
          severity: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h4" component="h2" gutterBottom fontWeight={700}>
          {t("betaTitle")}
        </Typography>
        <Alert severity="success" sx={{ mt: 2 }}>
          {t("betaSuccessMessage")}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="h4" component="h2" gutterBottom fontWeight={700}>
        {t("betaTitle")}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        {t("betaSubtitle")}
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="stretch"
          justifyContent="center"
        >
          <AlisaTextField
            label={t("betaEmailPlaceholder")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            sx={{ minWidth: { sm: 300 } }}
          />
          <AlisaButton
            type="submit"
            label={t("betaSubmitButton")}
            variant="contained"
            disabled={isLoading}
            sx={{ height: { sm: 56 } }}
          />
        </Stack>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 2, display: "block" }}
      >
        {t("betaPrivacyNote")}
      </Typography>
    </Box>
  );
}
