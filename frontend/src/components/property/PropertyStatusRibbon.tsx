import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PropertyStatus } from '@asset-types';

interface PropertyStatusRibbonProps {
  status: PropertyStatus;
  ownershipShare?: number;
}

const getStatusColor = (status: PropertyStatus): string => {
  switch (status) {
    case PropertyStatus.OWN:
      return 'success.main';
    case PropertyStatus.PROSPECT:
      return 'warning.main';
    case PropertyStatus.SOLD:
      return 'grey.600';
    default:
      return 'grey.500';
  }
};

function PropertyStatusRibbon({ status, ownershipShare = 100 }: PropertyStatusRibbonProps) {
  const { t } = useTranslation('property');

  const getStatusText = (): string => {
    switch (status) {
      case PropertyStatus.OWN:
        return t('ownershipStatus', { percent: ownershipShare });
      case PropertyStatus.PROSPECT:
        return t('prospectStatusRibbon');
      case PropertyStatus.SOLD:
        return t('soldStatus');
      default:
        return '';
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        width: 120,
        height: 120,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: (theme) => theme.spacing(3),
          left: (theme) => theme.spacing(-4),
          width: 150,
          transform: 'rotate(-45deg)',
          bgcolor: getStatusColor(status),
          py: 0.5,
          textAlign: 'center',
          boxShadow: 2,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'white',
            fontWeight: 600,
            fontSize: '0.75rem',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          {getStatusText()}
        </Typography>
      </Box>
    </Box>
  );
}

export default PropertyStatusRibbon;
