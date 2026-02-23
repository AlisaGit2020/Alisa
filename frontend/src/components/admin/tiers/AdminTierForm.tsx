import { Stack } from "@mui/material";
import { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { adminContext } from "@asset-lib/asset-contexts";
import AssetTextField from "../../asset/form/AssetTextField";
import AssetNumberField from "../../asset/form/AssetNumberField";
import AssetSwitch from "../../asset/form/AssetSwitch";
import { getNumber } from "@asset-lib/functions";
import { AssetButton, AssetDialog } from "../../asset";

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
      <AssetButton label={t("tierCancel")} onClick={onClose} />
      <AssetButton
        label={t("tierSave")}
        onClick={handleSubmit}
        variant="contained"
      />
    </>
  );

  return (
    <AssetDialog
      open={true}
      title={tier ? t("tierEdit") : t("tierAdd")}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      actions={dialogActions}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <AssetTextField
          label={t("tierName")}
          value={data.name}
          autoFocus
          onChange={(e) => setData({ ...data, name: e.target.value })}
        />
        <AssetNumberField
          label={t("tierPrice")}
          value={data.price}
          adornment="€"
          onChange={(e) =>
            setData({ ...data, price: getNumber(e.target.value, 2) })
          }
        />
        <AssetNumberField
          label={t("tierMaxProperties")}
          value={data.maxProperties}
          onChange={(e) =>
            setData({
              ...data,
              maxProperties: getNumber(e.target.value, 0),
            })
          }
        />
        <AssetNumberField
          label={t("tierSortOrder")}
          value={data.sortOrder}
          onChange={(e) =>
            setData({ ...data, sortOrder: getNumber(e.target.value, 0) })
          }
        />
        <AssetSwitch
          label={t("tierDefault")}
          value={data.isDefault}
          onChange={(e) => setData({ ...data, isDefault: e.target.checked })}
        />
      </Stack>
    </AssetDialog>
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
