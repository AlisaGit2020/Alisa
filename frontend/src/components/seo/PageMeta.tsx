import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface PageMetaProps {
  titleKey: string;
  descriptionKey: string;
  path: string;
}

const BASE_URL = 'https://sijoitusasuntoni.fi';

export function PageMeta({ titleKey, descriptionKey, path }: PageMetaProps) {
  const { t, i18n } = useTranslation('seo');

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{t(titleKey)} | Asset</title>
      <meta name="description" content={t(descriptionKey)} />
      <link rel="canonical" href={`${BASE_URL}${path}`} />
    </Helmet>
  );
}
