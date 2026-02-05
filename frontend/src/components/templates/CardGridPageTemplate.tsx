import { ReactNode } from "react";
import { Box } from "@mui/material";
import PageHeader from "./PageHeader";

interface CardGridPageTemplateProps {
  translationPrefix: string;
  titleKey?: string;
  descriptionKey?: string;
  children: ReactNode;
}

function CardGridPageTemplate({
  translationPrefix,
  titleKey,
  descriptionKey,
  children
}: CardGridPageTemplateProps) {
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

export default CardGridPageTemplate;
