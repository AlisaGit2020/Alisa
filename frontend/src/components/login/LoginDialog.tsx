import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import ApiClient from "@alisa-lib/api-client";
import { useTranslation } from "react-i18next";

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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {t("login:title")}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ py: 2 }}>
          <Typography variant="body1" color="text.secondary" align="center">
            {t("login:loginWith")}
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {t("login:continueWithGoogle")}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default LoginDialog;
