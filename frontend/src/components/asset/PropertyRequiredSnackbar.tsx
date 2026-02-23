import { Popover, Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelectProperty: () => void;
}

export function PropertyRequiredSnackbar({
  open,
  anchorEl,
  onClose,
  onSelectProperty,
}: Props) {
  const { t } = useTranslation("common");

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
    >
      <Alert
        severity="warning"
        onClose={onClose}
        action={
          <Button color="inherit" size="small" onClick={onSelectProperty}>
            {t("selectProperty")}
          </Button>
        }
      >
        {t("propertyRequiredMessage")}
      </Alert>
    </Popover>
  );
}
