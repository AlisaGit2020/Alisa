import { Stack } from "@mui/material";
import { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { adminContext } from "@alisa-lib/alisa-contexts";
import AlisaTextField from "../../alisa/form/AlisaTextField";
import AlisaNumberField from "../../alisa/form/AlisaNumberField";
import AlisaSwitch from "../../alisa/form/AlisaSwitch";
import { getNumber } from "@alisa-lib/functions";
import { AlisaButton, AlisaDialog } from "../../alisa";

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

interface AdminTierFormContentProps {
  t: TFunction;
  tier: TierData | null;
  onClose: () => void;
  onSave: (tier: TierData) => void;
}

function AdminTierFormContent({
  t,
  tier,
  onClose,
  onSave,
}: AdminTierFormContentProps) {
  const [data, setData] = useState<TierData>(tier ?? defaultTierData);

  const handleSubmit = () => {
    onSave(data);
  };

  const dialogActions = (
    <>
      <AlisaButton label={t("tierCancel")} onClick={onClose} />
      <AlisaButton
        label={t("tierSave")}
        onClick={handleSubmit}
        variant="contained"
      />
    </>
  );

  return (
    <AlisaDialog
      open={true}
      title={tier ? t("tierEdit") : t("tierAdd")}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      actions={dialogActions}
    >
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
    </AlisaDialog>
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

  if (!open) {
    return null;
  }

  return (
    <AdminTierFormContent
      key={formKey}
      t={t}
      tier={tier}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

export default withTranslation(adminContext.name)(AdminTierForm);
