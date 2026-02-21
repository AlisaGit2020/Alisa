import { ReactNode } from "react";
import { Box } from "@mui/material";
import PageHeader from "./PageHeader";

interface ListPageTemplateProps {
  translationPrefix: string;
  titleKey?: string;
  descriptionKey?: string;
  moreDetailsKey?: string;
  children: ReactNode;
}

function ListPageTemplate({
  translationPrefix,
  titleKey,
  descriptionKey,
  moreDetailsKey,
  children,
}: ListPageTemplateProps) {
  return (
    <Box>
      <PageHeader
        translationPrefix={translationPrefix}
        titleKey={titleKey}
        descriptionKey={descriptionKey}
        moreDetailsKey={moreDetailsKey}
      />
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Box>
  );
}

export default ListPageTemplate;
