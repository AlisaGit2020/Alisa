import { Box, Card, CardContent, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Property } from '@asset-types';

interface ProspectInvestmentSectionProps {
  property: Property;
}

// TODO: Investment analysis feature to be designed and implemented properly
function ProspectInvestmentSection({ property }: ProspectInvestmentSectionProps) {
  const { t } = useTranslation('property');

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}
      >
        {t('investmentAnalysis')} - {property.name}
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {t('upcomingFeature')}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ProspectInvestmentSection;
