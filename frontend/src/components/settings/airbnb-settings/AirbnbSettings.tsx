import { Box, Paper, Stack, Typography } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { incomeTypeContext, settingsContext } from "@alisa-lib/alisa-contexts";
import React from "react";
import ApiClient from "@alisa-lib/api-client";
import AlisaSelect from "../../alisa/data/AlisaSelect";
import DataService from "@alisa-lib/data-service";
import { IncomeType } from "@alisa-types";
import { AlisaApproveIcon } from "../../alisa/AlisaIcons";
import { AlisaButton, useToast } from "../../alisa";

interface AirbnbSettingsData {
  airbnbIncomeTypeId: number;
}

function AirbnbSettings({ t }: WithTranslation) {
  const [data, setData] = React.useState<AirbnbSettingsData>({
    airbnbIncomeTypeId: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const { showToast } = useToast();

  React.useEffect(() => {
    const loadSettings = async () => {
      const user = await ApiClient.me();
      setData({
        airbnbIncomeTypeId: user.airbnbIncomeTypeId || 0,
      });
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleChange = (fieldName: keyof AirbnbSettingsData, value: number) => {
    setData({ ...data, [fieldName]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    await ApiClient.updateUserSettings({
      airbnbIncomeTypeId:
        data.airbnbIncomeTypeId > 0 ? data.airbnbIncomeTypeId : undefined,
    });
    setSaving(false);
    showToast({ message: t("common:toast.settingsSaved"), severity: "success" });
  };

  if (loading) {
    return null;
  }

  return (
    <Paper sx={{ padding: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t("airbnbSettings")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("airbnbSettingsDescription")}
      </Typography>
      <Stack spacing={3} sx={{ maxWidth: 400 }}>
        <AlisaSelect<AirbnbSettingsData, IncomeType>
          label={t("airbnbIncomeType")}
          dataService={
            new DataService<IncomeType>({
              context: incomeTypeContext,
              fetchOptions: { order: { name: "ASC" } },
            })
          }
          fieldName="airbnbIncomeTypeId"
          value={data.airbnbIncomeTypeId}
          onHandleChange={handleChange}
        />
        <Box>
          <AlisaButton
            label={t("save")}
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            endIcon={<AlisaApproveIcon />}
          />
        </Box>
      </Stack>
    </Paper>
  );
}

export default withTranslation(settingsContext.name)(AirbnbSettings);
