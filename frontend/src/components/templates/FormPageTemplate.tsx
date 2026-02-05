import { ReactNode } from "react";
import { Box } from "@mui/material";
import PageHeader from "./PageHeader";

interface FormPageTemplateProps {
  translationPrefix: string;
  titleKey?: string;
  descriptionKey?: string;
  children: ReactNode;
}

function FormPageTemplate({
  translationPrefix,
  titleKey,
  descriptionKey,
  children
}: FormPageTemplateProps) {
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

export default FormPageTemplate;
