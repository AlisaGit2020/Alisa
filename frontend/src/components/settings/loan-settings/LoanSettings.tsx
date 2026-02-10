import { Box, Paper, Stack, Typography } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { expenseTypeContext, settingsContext } from "@alisa-lib/alisa-contexts";
import React from "react";
import ApiClient from "@alisa-lib/api-client";
import AlisaSelect from "../../alisa/data/AlisaSelect";
import DataService from "@alisa-lib/data-service";
import { ExpenseType } from "@alisa-types";
import { AlisaApproveIcon } from "../../alisa/AlisaIcons";
import { AlisaButton, useToast } from "../../alisa";

interface LoanSettingsData {
  loanPrincipalExpenseTypeId: number;
  loanInterestExpenseTypeId: number;
  loanHandlingFeeExpenseTypeId: number;
}

function LoanSettings({ t }: WithTranslation) {
  const [data, setData] = React.useState<LoanSettingsData>({
    loanPrincipalExpenseTypeId: 0,
    loanInterestExpenseTypeId: 0,
    loanHandlingFeeExpenseTypeId: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const { showToast } = useToast();

  React.useEffect(() => {
    const loadSettings = async () => {
      const user = await ApiClient.me();
      setData({
        loanPrincipalExpenseTypeId: user.loanPrincipalExpenseTypeId || 0,
        loanInterestExpenseTypeId: user.loanInterestExpenseTypeId || 0,
        loanHandlingFeeExpenseTypeId: user.loanHandlingFeeExpenseTypeId || 0,
      });
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleChange = (fieldName: keyof LoanSettingsData, value: number) => {
    setData({ ...data, [fieldName]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    await ApiClient.updateUserSettings({
      loanPrincipalExpenseTypeId:
        data.loanPrincipalExpenseTypeId > 0
          ? data.loanPrincipalExpenseTypeId
          : undefined,
      loanInterestExpenseTypeId:
        data.loanInterestExpenseTypeId > 0
          ? data.loanInterestExpenseTypeId
          : undefined,
      loanHandlingFeeExpenseTypeId:
        data.loanHandlingFeeExpenseTypeId > 0
          ? data.loanHandlingFeeExpenseTypeId
          : undefined,
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
        {t("loanSettings")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("loanSettingsDescription")}
      </Typography>
      <Stack spacing={3} sx={{ maxWidth: 400 }}>
        <AlisaSelect<LoanSettingsData, ExpenseType>
          label={t("loanPrincipal")}
          dataService={
            new DataService<ExpenseType>({
              context: expenseTypeContext,
              fetchOptions: { order: { name: "ASC" } },
            })
          }
          fieldName="loanPrincipalExpenseTypeId"
          value={data.loanPrincipalExpenseTypeId}
          onHandleChange={handleChange}
        />
        <AlisaSelect<LoanSettingsData, ExpenseType>
          label={t("loanInterest")}
          dataService={
            new DataService<ExpenseType>({
              context: expenseTypeContext,
              fetchOptions: { order: { name: "ASC" } },
            })
          }
          fieldName="loanInterestExpenseTypeId"
          value={data.loanInterestExpenseTypeId}
          onHandleChange={handleChange}
        />
        <AlisaSelect<LoanSettingsData, ExpenseType>
          label={t("loanHandlingFee")}
          dataService={
            new DataService<ExpenseType>({
              context: expenseTypeContext,
              fetchOptions: { order: { name: "ASC" } },
            })
          }
          fieldName="loanHandlingFeeExpenseTypeId"
          value={data.loanHandlingFeeExpenseTypeId}
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

export default withTranslation(settingsContext.name)(LoanSettings);
