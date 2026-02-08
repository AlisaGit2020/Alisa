import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { adminContext } from "@alisa-lib/alisa-contexts";
import AlisaTextField from "../../alisa/form/AlisaTextField";
import AlisaNumberField from "../../alisa/form/AlisaNumberField";
import AlisaSwitch from "../../alisa/form/AlisaSwitch";
import { getNumber } from "@alisa-lib/functions";

interface TierData {
  id?: number;
  name: string;
  price: number;
  maxProperties: number;
  sortOrder: number;
  isDefault: boolean;
}

const defaultTierData: TierData = {
  name: "",
  price: 0,
  maxProperties: 0,
  sortOrder: 0,
  isDefault: false,
};

interface AdminTierFormProps extends WithTranslation {
  open: boolean;
  tier: TierData | null;
  onClose: () => void;
  onSave: (tier: TierData) => void;
}

function AdminTierFormContent({
  t,
  tier,
  onClose,
  onSave,
}: Omit<AdminTierFormProps, "open">) {
  const [data, setData] = useState<TierData>(tier ?? defaultTierData);

  const handleSubmit = () => {
    onSave(data);
  };

  return (
    <>
      <DialogTitle>{tier ? t("tierEdit") : t("tierAdd")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <AlisaTextField
            label={t("tierName")}
            value={data.name}
            autoFocus
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />
          <AlisaNumberField
            label={t("tierPrice")}
            value={data.price}
            adornment="€"
            onChange={(e) =>
              setData({ ...data, price: getNumber(e.target.value, 2) })
            }
          />
          <AlisaNumberField
            label={t("tierMaxProperties")}
            value={data.maxProperties}
            onChange={(e) =>
              setData({
                ...data,
                maxProperties: getNumber(e.target.value, 0),
              })
            }
          />
          <AlisaNumberField
            label={t("tierSortOrder")}
            value={data.sortOrder}
            onChange={(e) =>
              setData({ ...data, sortOrder: getNumber(e.target.value, 0) })
            }
          />
          <AlisaSwitch
            label={t("tierDefault")}
            value={data.isDefault}
            onChange={(e) => setData({ ...data, isDefault: e.target.checked })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("tierCancel")}</Button>
        <Button onClick={handleSubmit} variant="contained">
          {t("tierSave")}
        </Button>
      </DialogActions>
    </>
  );
}

function AdminTierForm({
  t,
  open,
  tier,
  onClose,
  onSave,
}: AdminTierFormProps) {
  // Use key to reset form state when dialog opens with different tier or when reopened
  const formKey = `${open}-${tier?.id ?? "new"}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {open && (
        <AdminTierFormContent
          key={formKey}
          t={t}
          tier={tier}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Dialog>
  );
}

export default withTranslation(adminContext.name)(AdminTierForm);
