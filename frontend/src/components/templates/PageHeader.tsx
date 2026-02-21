import { useState } from "react";
import { Collapse, Link, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface PageHeaderProps {
  translationPrefix: string;
  titleKey?: string;
  descriptionKey?: string;
  moreDetailsKey?: string;
}

function PageHeader({
  translationPrefix,
  titleKey = "pageTitle",
  descriptionKey = "pageDescription",
  moreDetailsKey,
}: PageHeaderProps) {
  const { t } = useTranslation(translationPrefix);
  const { t: tCommon } = useTranslation("common");
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t(titleKey)}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {t(descriptionKey)}
      </Typography>
      {moreDetailsKey && (
        <>
          <Collapse in={expanded}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2, whiteSpace: "pre-line" }}
            >
              {t(moreDetailsKey)}
            </Typography>
          </Collapse>
          <Link
            component="button"
            variant="body2"
            onClick={handleToggle}
            sx={{ mt: 1, display: "inline-block" }}
          >
            {expanded ? tCommon("showLess") : tCommon("readMore")}
          </Link>
        </>
      )}
    </Paper>
  );
}

export default PageHeader;
