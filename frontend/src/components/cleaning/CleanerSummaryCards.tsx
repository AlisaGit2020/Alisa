import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { TFunction } from 'i18next';
import { Cleaning } from '@asset-types';

interface CleanerSummaryCardsProps {
  t: TFunction;
  cleanings: Cleaning[];
  bruttoPrice: number;
}

interface CleanerSummary {
  userId: number;
  cleanerName: string;
  count: number;
  totalAmount: number;
}

function CleanerSummaryCards({ t, cleanings, bruttoPrice }: CleanerSummaryCardsProps) {
  // Calculate per-cleaner summaries
  const summaries: CleanerSummary[] = [];
  const cleanerMap = new Map<number, CleanerSummary>();

  cleanings.forEach((cleaning) => {
    const amount = (bruttoPrice * cleaning.percentage) / 100;
    const userId = cleaning.userId;
    const cleanerName = cleaning.user
      ? `${cleaning.user.firstName} ${cleaning.user.lastName}`
      : t('cleaning:cleaner');

    if (cleanerMap.has(userId)) {
      const existing = cleanerMap.get(userId)!;
      existing.count += 1;
      existing.totalAmount += amount;
    } else {
      cleanerMap.set(userId, {
        userId,
        cleanerName,
        count: 1,
        totalAmount: amount,
      });
    }
  });

  summaries.push(...cleanerMap.values());

  // Sort by total amount descending
  summaries.sort((a, b) => b.totalAmount - a.totalAmount);

  if (summaries.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        sx={{
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: '0.75rem',
          fontWeight: 500,
          mb: 1.5,
        }}
      >
        {t('cleaning:monthlySummary')}
      </Typography>
      <Grid container spacing={2}>
        {summaries.map((summary) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={summary.userId}>
            <Card
              sx={{
                bgcolor: 'grey.100',
                boxShadow: 1,
              }}
            >
              <CardContent sx={{ pb: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {summary.cleanerName}
                </Typography>
                <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 600 }}>
                  {t('common:format.currency.euro', { val: summary.totalAmount })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {summary.count} {summary.count === 1 ? t('cleaning:cleaning') : t('cleaning:cleanings')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default CleanerSummaryCards;
