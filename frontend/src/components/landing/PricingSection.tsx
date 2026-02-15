import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Card, Container, Grid, Typography, CircularProgress } from "@mui/material";
import { AlisaButton } from "../alisa";
import React from "react";
import ApiClient from "@alisa-lib/api-client";

interface Tier {
  id: number;
  name: string;
  price: number;
  maxProperties: number;
  sortOrder: number;
  isDefault: boolean;
}

interface PricingSectionProps extends WithTranslation {
  onLoginClick: () => void;
}

function PricingSection({ t, onLoginClick }: PricingSectionProps) {
  const [tiers, setTiers] = React.useState<Tier[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTiers = async () => {
      try {
        const data = await ApiClient.fetchPublic<Tier[]>('pricing/tiers');
        setTiers(data);
      } catch (error) {
        console.error('Failed to fetch pricing tiers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTiers();
  }, []);

  const formatPrice = (price: number): string => {
    if (price === 0) {
      return t('landing:pricing.free');
    }
    return `${price} ${t('landing:pricing.perMonth')}`;
  };

  const formatProperties = (maxProperties: number): string => {
    if (maxProperties === 0) {
      return t('landing:pricing.unlimited');
    }
    if (maxProperties === 1) {
      return `1 ${t('landing:pricing.property')}`;
    }
    return `${maxProperties} ${t('landing:pricing.properties')}`;
  };

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box id="pricing" sx={{ py: 8, bgcolor: 'action.hover', scrollMarginTop: '80px' }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" component="h2" gutterBottom fontWeight={700}>
            {t('landing:pricing.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {t('landing:pricing.subtitle')}
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {tiers.map((tier) => {
            const isFree = tier.price === 0;

            return (
              <Grid key={tier.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  elevation={isFree ? 4 : 1}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 4,
                    border: isFree ? '2px solid' : '1px solid',
                    borderColor: isFree ? 'primary.main' : 'divider',
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  {isFree && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {t('landing:pricing.startFree')}
                    </Box>
                  )}

                  <Typography
                    variant="h5"
                    component="h3"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    {tier.name}
                  </Typography>

                  <Typography
                    variant="h3"
                    component="div"
                    fontWeight={700}
                    color={isFree ? 'primary.main' : 'text.primary'}
                    sx={{ mb: 3 }}
                  >
                    {formatPrice(tier.price)}
                  </Typography>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 4, flexGrow: 1 }}
                  >
                    {formatProperties(tier.maxProperties)}
                  </Typography>

                  <AlisaButton
                    label={isFree ? t('landing:pricing.startFree') : t('landing:pricing.getStarted')}
                    variant={isFree ? "contained" : "outlined"}
                    fullWidth
                    onClick={onLoginClick}
                    sx={{ mt: 'auto' }}
                  />
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}

export default withTranslation(["landing"])(PricingSection);
