import { Box, Card, CardContent, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Property } from '@asset-types';

interface SoldSummarySectionProps {
  property: Property;
}

// TODO: Sale data fields (saleDate, salePrice) to be added to Property entity in future backend migration
function SoldSummarySection({ property }: SoldSummarySectionProps) {
  const { t } = useTranslation('property');

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}
      >
        {t('saleSummary')} - {property.name}
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {t('comingSoon')}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default SoldSummarySection;
