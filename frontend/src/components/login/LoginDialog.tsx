import { Typography, Stack } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import ApiClient from "@alisa-lib/api-client";
import { useTranslation } from "react-i18next";
import { AlisaButton, AlisaDialog } from "../alisa";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

function LoginDialog({ open, onClose }: LoginDialogProps) {
  const { t } = useTranslation();

  const handleGoogleLogin = async () => {
    const redirectUrl = await ApiClient.authGoogle();
    window.location.href = redirectUrl;
  };

  return (
    <AlisaDialog
      open={open}
      onClose={onClose}
      title={t("login:title")}
      maxWidth="xs"
      fullWidth
    >
      <Stack spacing={3} sx={{ py: 2 }}>
        <Typography variant="body1" color="text.secondary" align="center">
          {t("login:loginWith")}
        </Typography>
        <AlisaButton
          label={t("login:continueWithGoogle")}
          variant="contained"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          fullWidth
          sx={{ py: 1.5 }}
        />
      </Stack>
    </AlisaDialog>
  );
}

export default LoginDialog;
