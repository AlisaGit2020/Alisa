import { Typography, Stack } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import FacebookIcon from "@mui/icons-material/Facebook";
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

  const handleFacebookLogin = async () => {
    const redirectUrl = await ApiClient.authFacebook();
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
      <Stack spacing={2} sx={{ py: 2 }}>
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
        <AlisaButton
          label={t("login:continueWithFacebook")}
          variant="contained"
          size="large"
          startIcon={<FacebookIcon />}
          onClick={handleFacebookLogin}
          fullWidth
          sx={{
            py: 1.5,
            bgcolor: '#1877F2',
            '&:hover': {
              bgcolor: '#166FE5',
            },
          }}
        />
      </Stack>
    </AlisaDialog>
  );
}

export default LoginDialog;
