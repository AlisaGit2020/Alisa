import { ReactNode } from "react";
import { Box } from "@mui/material";
import PageHeader from "./PageHeader";

interface DashboardPageTemplateProps {
  translationPrefix: string;
  titleKey?: string;
  descriptionKey?: string;
  children: ReactNode;
}

function DashboardPageTemplate({
  translationPrefix,
  titleKey,
  descriptionKey,
  children
}: DashboardPageTemplateProps) {
  return (
    <Box>
      <PageHeader
        translationPrefix={translationPrefix}
        titleKey={titleKey}
        descriptionKey={descriptionKey}
      />
      <Box sx={{ mt: 2 }}>
        {children}
      </Box>
    </Box>
  );
}

export default DashboardPageTemplate;
