// Mock for PageMeta component
import React from 'react';

interface PageMetaProps {
  titleKey: string;
  descriptionKey: string;
  path: string;
}

export function PageMeta({ titleKey, descriptionKey, path }: PageMetaProps) {
  // Return null - PageMeta only sets document head, doesn't render visible content
  return null;
}

export default PageMeta;