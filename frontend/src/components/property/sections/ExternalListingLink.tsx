import { Box, Link, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { PropertyExternalSource, PropertyExternalSourceName, propertyExternalSourceNames } from '@asset-types';

interface ExternalListingLinkProps {
  externalSource: PropertyExternalSource;
  externalSourceId: string;
}

function getExternalUrl(source: PropertyExternalSource, sourceId: string): string {
  switch (source) {
    case PropertyExternalSource.OIKOTIE:
      return `https://asunnot.oikotie.fi/myytavat-asunnot/${sourceId}`;
    case PropertyExternalSource.ETUOVI:
      return `https://www.etuovi.com/kohde/${sourceId}`;
    default:
      return '';
  }
}

function getSourceDisplayName(source: PropertyExternalSource): string {
  const name = propertyExternalSourceNames.get(source);
  switch (name) {
    case PropertyExternalSourceName.OIKOTIE:
      return 'Oikotie';
    case PropertyExternalSourceName.ETUOVI:
      return 'Etuovi';
    default:
      return '';
  }
}

function ExternalListingLink({ externalSource, externalSourceId }: ExternalListingLinkProps) {
  const { t } = useTranslation('property');

  const url = getExternalUrl(externalSource, externalSourceId);
  const sourceName = getSourceDisplayName(externalSource);

  if (!url) {
    return null;
  }

  return (
    <Box sx={{ p: 2, pt: 0 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}
      >
        {t('viewListing')}
      </Typography>
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        }}
      >
        {t('viewOnSource', { source: sourceName })}
        <OpenInNewIcon fontSize="small" />
      </Link>
    </Box>
  );
}

export default ExternalListingLink;
