import { Box, IconButton, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cleaning, Property } from '@asset-types';
import ApiClient from '@asset-lib/api-client';
import AssetLoadingProgress from '../asset/AssetLoadingProgress';
import AssetButton from '../asset/form/AssetButton';
import AssetDataTable from '../asset/datatable/AssetDataTable';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CleanerSummaryCards from './CleanerSummaryCards';

interface CleaningRow extends Cleaning {
  cleanerName: string;
  amount: number;
}

function AdminCleaningPage() {
  const { t } = useTranslation(['cleaning', 'property', 'common']);
  const [property, setProperty] = useState<Property | null>(null);
  const [cleanings, setCleanings] = useState<Cleaning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [year, setYear] = useState(now.getFullYear());

  const { idParam } = useParams();
  const navigate = useNavigate();

  // Fetch property once
  useEffect(() => {
    const fetchProperty = async () => {
      if (!idParam) {
        setError('Property ID not provided');
        setLoading(false);
        return;
      }

      try {
        const data = await ApiClient.get<Property>('real-estate/property', Number(idParam));
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

  // Fetch cleanings when month/year/refresh changes
  useEffect(() => {
    const fetchCleanings = async () => {
      if (!idParam) return;

      try {
        const url = `cleaning/property/${idParam}?month=${month}&year=${year}`;
        const data = await ApiClient.fetch<Cleaning[]>(url);
        setCleanings(data);
      } catch (err) {
        console.error('Failed to load cleanings:', err);
        setCleanings([]);
      }
    };

    if (property) {
      fetchCleanings();
    }
  }, [idParam, month, year, refreshTrigger, property]);

  // Transform cleanings to rows with computed fields
  const rows: CleaningRow[] = useMemo(() => {
    const bruttoPrice = property?.cleaningBruttoPrice || 0;
    return cleanings.map((cleaning) => ({
      ...cleaning,
      cleanerName: cleaning.user
        ? `${cleaning.user.firstName} ${cleaning.user.lastName}`
        : t('cleaning:cleaner'),
      amount: (bruttoPrice * cleaning.percentage) / 100,
    }));
  }, [cleanings, property, t]);

  // Handle delete
  const handleDelete = async (id: number) => {
    try {
      await ApiClient.delete('cleaning', id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error deleting cleaning:', error);
    }
  };

  const handleBack = () => {
    navigate(`/app/portfolio/own/${idParam}`);
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <AssetLoadingProgress />
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

  const monthName = t(`common:${new Date(year, month - 1).toLocaleString('en-US', { month: 'long' }).toLowerCase()}`);
  const bruttoPrice = property.cleaningBruttoPrice || 0;

  return (
    <Paper sx={{ p: 3 }}>
      {/* Back button and title */}
      <Box sx={{ mb: 2 }}>
        <AssetButton
          label={t('cleaning:back')}
          variant="text"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ ml: -1, mb: 1 }}
        />
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
          {property.name} - {t('cleaning:pageTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('cleaning:bruttoPrice')}: {t('common:format.currency.euro', { val: bruttoPrice })}
        </Typography>
      </Box>

      {/* Month navigator */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={handlePrevMonth} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
            {monthName} {year}
          </Typography>
          <IconButton onClick={handleNextMonth} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Cleaner summary cards */}
      <CleanerSummaryCards t={t} cleanings={cleanings} bruttoPrice={bruttoPrice} />

      {/* Data table */}
      <Box>
        <AssetDataTable<CleaningRow>
          t={t}
          data={rows}
          fields={[
            { name: 'date', format: 'date' },
            { name: 'cleanerName', label: t('cleaning:cleaner') },
            { name: 'percentage', label: t('cleaning:percentage') },
            { name: 'amount', format: 'currency', sum: true, label: t('cleaning:amount') },
          ]}
          selectedIds={[]}
          onSelectChange={() => {}}
          onDeleteRequest={handleDelete}
          sortable
        />
      </Box>

      {rows.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {t('cleaning:noCleanings')}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default AdminCleaningPage;
