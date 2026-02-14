import { Box, CircularProgress, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WithTranslation, withTranslation } from 'react-i18next';
import { propertyContext } from '../../lib/alisa-contexts';
import { Property } from '@alisa-types';
import ApiClient from '../../lib/api-client';
import AlisaLoadingProgress from '../alisa/AlisaLoadingProgress';
import AlisaButton from '../alisa/form/AlisaButton';
import { VITE_API_URL } from '../../constants';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PropertyReportSection from './report/PropertyReportSection';

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 2, minWidth: 24 }}>
        {icon}
      </Box>
      <Typography sx={{ color: 'text.secondary', minWidth: 150 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

interface OwnershipBadgeProps {
  percentage: number;
  label: string;
}

function OwnershipBadge({ percentage, label }: OwnershipBadgeProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={percentage}
          size={56}
          thickness={4}
          sx={{ color: percentage === 100 ? 'success.main' : 'primary.main' }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body1" component="div" sx={{ fontWeight: 600 }}>
            {percentage}%
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
        {label}
      </Typography>
    </Box>
  );
}

function PropertyView({ t }: WithTranslation) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { idParam } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperty = async () => {
      if (!idParam) {
        setError('Property ID not provided');
        setLoading(false);
        return;
      }

      try {
        const data = await ApiClient.get<Property>(
          propertyContext.apiPath,
          Number(idParam),
          { ownerships: true }
        );
        setProperty(data);
      } catch (err) {
        setError('Failed to load property');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [idParam]);

  const handleEdit = () => {
    navigate(`${propertyContext.routePath}/edit/${idParam}`, {
      state: { returnTo: 'view' },
    });
  };

  const handleBack = () => {
    navigate(propertyContext.routePath);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <AlisaLoadingProgress />
      </Paper>
    );
  }

  if (error || !property) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="error">{error || 'Property not found'}</Typography>
      </Paper>
    );
  }

  const imageUrl = property.photo
    ? `${VITE_API_URL}/${property.photo}`
    : '/assets/properties/placeholder.svg';

  const ownershipShare = property.ownerships?.[0]?.share ?? 100;

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      {/* Hero image with ownership badge overlay */}
      <Box sx={{ position: 'relative' }}>
        <Box
          component="img"
          src={imageUrl}
          alt={property.name}
          sx={{
            width: '100%',
            height: { xs: 200, sm: 250, md: 300 },
            objectFit: 'cover',
          }}
        />
        {/* Ownership badge floating over image */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -28,
            right: 16,
            bgcolor: 'background.paper',
            borderRadius: '50%',
            p: 0.5,
            boxShadow: 2,
          }}
        >
          <OwnershipBadge percentage={ownershipShare} label={t('ownershipShare')} />
        </Box>
      </Box>

      {/* Back button */}
      <Box sx={{ p: 2, pb: 0 }}>
        <AlisaButton
          label={t('back')}
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        />
      </Box>

      {/* Header with name and edit button */}
      <Box sx={{ p: 2, pt: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h5" component="h1" gutterBottom>
              {property.name}
            </Typography>
            {property.apartmentType && (
              <Typography variant="body1" color="text.secondary">
                {property.apartmentType}
              </Typography>
            )}
          </Box>
          <AlisaButton
            label={t('editProperty')}
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          />
        </Stack>
      </Box>

      <Divider />

      {/* Property Information and Location - side by side on larger screens */}
      <Box sx={{ p: 2 }}>
        <Grid container spacing={4}>
          {/* Property Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
              {t('propertyInfo')}
            </Typography>
            <DetailRow
              icon={<SquareFootIcon fontSize="small" />}
              label={t('size')}
              value={`${property.size} m²`}
            />
            {property.buildYear && (
              <DetailRow
                icon={<CalendarTodayIcon fontSize="small" />}
                label={t('buildYear')}
                value={property.buildYear}
              />
            )}
          </Grid>

          {/* Location */}
          {(property.address?.street || property.address?.city) && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
                {t('locationInfo')}
              </Typography>
              {property.address?.street && (
                <DetailRow
                  icon={<LocationOnIcon fontSize="small" />}
                  label={t('address')}
                  value={property.address.street}
                />
              )}
              {property.address?.city && (
                <DetailRow
                  icon={<LocationCityIcon fontSize="small" />}
                  label={t('city')}
                  value={`${property.address.postalCode ? property.address.postalCode + ' ' : ''}${property.address.city}`}
                />
              )}
            </Grid>
          )}
        </Grid>
      </Box>

      <Divider />

      {/* Description */}
      {property.description && (
        <>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
              {t('description')}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {property.description}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Financial Statistics Section */}
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.875rem' }}>
          {t('statisticsSection')}
        </Typography>
        <PropertyReportSection propertyId={property.id} />
      </Box>
    </Paper>
  );
}

export default withTranslation(propertyContext.name)(PropertyView);
