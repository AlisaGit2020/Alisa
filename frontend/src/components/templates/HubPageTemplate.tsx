import { ReactNode } from "react";
import { Box } from "@mui/material";
import PageHeader from "./PageHeader";

interface HubPageTemplateProps {
  translationPrefix: string;
  titleKey?: string;
  descriptionKey?: string;
  children: ReactNode;
}

function HubPageTemplate({
  translationPrefix,
  titleKey,
  descriptionKey,
  children
}: HubPageTemplateProps) {
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

export default HubPageTemplate;
