import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface PageMetaProps {
  titleKey: string;
  descriptionKey: string;
  path: string;
}

const BASE_URL =
  import.meta.env.VITE_BASE_URL || 'https://sijoitusasuntoni.fi';

export function PageMeta({ titleKey, descriptionKey, path }: PageMetaProps) {
  const { t, i18n } = useTranslation('seo');
  const title = t(titleKey);
  const description = t(descriptionKey);
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{title} | Asset</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
}
