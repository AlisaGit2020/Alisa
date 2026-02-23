import React from "react";
import {
  FormControl,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { useThemeMode } from "@asset-lib/theme-context";
import { settingsContext } from "@asset-lib/asset-contexts";

function ThemeSettings({ t }: WithTranslation) {
  const { mode, setMode } = useThemeMode();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMode(event.target.value as "light" | "dark");
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t("themeSettings")}
      </Typography>
      <FormControl>
        <RadioGroup value={mode} onChange={handleChange}>
          <FormControlLabel
            value="light"
            control={<Radio />}
            label={t("lightTheme")}
          />
          <FormControlLabel
            value="dark"
            control={<Radio />}
            label={t("darkTheme")}
          />
        </RadioGroup>
      </FormControl>
    </Paper>
  );
}

export default withTranslation(settingsContext.name)(ThemeSettings);
