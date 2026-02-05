import { Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface PageHeaderProps {
  translationPrefix: string;
  titleKey?: string;
  descriptionKey?: string;
}

function PageHeader({
  translationPrefix,
  titleKey = "pageTitle",
  descriptionKey = "pageDescription"
}: PageHeaderProps) {
  const { t } = useTranslation(translationPrefix);

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t(titleKey)}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {t(descriptionKey)}
      </Typography>
    </Paper>
  );
}

export default PageHeader;
