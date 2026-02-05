import { ReactNode } from "react";
import { Box } from "@mui/material";
import PageHeader from "./PageHeader";

interface ListPageTemplateProps {
  translationPrefix: string;
  titleKey?: string;
  descriptionKey?: string;
  children: ReactNode;
}

function ListPageTemplate({
  translationPrefix,
  titleKey,
  descriptionKey,
  children
}: ListPageTemplateProps) {
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

export default ListPageTemplate;
