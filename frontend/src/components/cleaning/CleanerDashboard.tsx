import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AssetButton, AssetDatePicker, AssetNumberField, AssetSelectField } from '../asset';
import AssetDataTable, { AssetDataTableField } from '../asset/datatable/AssetDataTable';
import Title from '../../Title';
import ApiClient from '@asset-lib/api-client';
import { Cleaning, PropertyCleaner } from '@asset-types';
import { useToast } from '../asset/toast';
import dayjs from 'dayjs';

interface CleaningRow extends Cleaning {
  propertyName: string;
  amount: number;
}

function CleanerDashboard() {
  const { t } = useTranslation(['cleaning']);
  const { showToast } = useToast();

  const [properties, setProperties] = React.useState<PropertyCleaner[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<number | ''>('');
  const [cleanings, setCleanings] = React.useState<Cleaning[]>([]);
  const [date, setDate] = React.useState<Date | null>(new Date());
  const [percentage, setPercentage] = React.useState<number | ''>(100);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Fetch assigned properties on mount
  React.useEffect(() => {
    const fetchProperties = async () => {
      try {
        const result = await ApiClient.fetch<PropertyCleaner[]>('cleaning/my/properties');
        setProperties(result);

        // Pre-select first property if available
        if (result.length > 0) {
          setSelectedPropertyId(result[0].propertyId);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        showToast({ message: 'Error loading properties', severity: 'error' });
      }
    };

    fetchProperties();
  }, [showToast]);

  // Fetch cleanings on mount and refresh
  React.useEffect(() => {
    const fetchCleanings = async () => {
      try {
        const result = await ApiClient.fetch<Cleaning[]>('cleaning/my');
        setCleanings(result);
      } catch (error) {
        console.error('Error fetching cleanings:', error);
        showToast({ message: 'Error loading cleaning history', severity: 'error' });
      }
    };

    fetchCleanings();
  }, [refreshTrigger, showToast]);

  const handleSave = async () => {
    if (!selectedPropertyId || !date) {
      showToast({ message: 'Please select property and date', severity: 'error' });
      return;
    }

    try {
      await ApiClient.post('cleaning', {
        propertyId: selectedPropertyId,
        date: dayjs(date).format('YYYY-MM-DD'),
        percentage: percentage || 100,
      });

      showToast({ message: t('toast.saveSuccess'), severity: 'success' });

      // Reset form
      setDate(new Date());
      setPercentage(100);

      // Refresh cleanings list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error saving cleaning:', error);
      showToast({ message: 'Error saving cleaning', severity: 'error' });
    }
  };

  const selectedProperty = properties.find(p => p.propertyId === selectedPropertyId)?.property;
  const calculatedAmount = selectedProperty?.cleaningBruttoPrice
    ? (selectedProperty.cleaningBruttoPrice * (Number(percentage) || 100)) / 100
    : 0;

  // Transform cleanings to rows with computed fields
  const cleaningRows: CleaningRow[] = cleanings.map(cleaning => {
    const property = properties.find(p => p.propertyId === cleaning.propertyId)?.property;
    const bruttoPrice = property?.cleaningBruttoPrice || 0;
    const amount = (bruttoPrice * cleaning.percentage) / 100;

    return {
      ...cleaning,
      propertyName: property?.name || '',
      amount,
    };
  });

  const fields: AssetDataTableField<CleaningRow>[] = [
    { name: 'date', format: 'date' },
    { name: 'propertyName' },
    { name: 'percentage' },
    { name: 'amount', format: 'currency', sum: true },
  ];

  const handleDelete = async (id: number) => {
    try {
      await ApiClient.delete('cleaning', id);
      setRefreshTrigger(prev => prev + 1);
      showToast({ message: t('toast.deleteSuccess'), severity: 'success' });
    } catch (error) {
      console.error('Error deleting cleaning:', error);
      showToast({ message: 'Error deleting cleaning', severity: 'error' });
    }
  };

  return (
    <Box>
      <Title>{t('cleaning:pageTitle')}</Title>

      {/* Add Cleaning Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('cleaning:addCleaning')}
          </Typography>

          <Stack spacing={2}>
            {/* Property Selector */}
            {properties.length === 1 ? (
              <Typography variant="body1">
                {t('cleaning:property')}: {properties[0].property?.name}
              </Typography>
            ) : properties.length > 1 ? (
              <AssetSelectField
                label={t('cleaning:property')}
                value={selectedPropertyId}
                items={properties.map(p => ({
                  id: p.propertyId,
                  name: p.property?.name || ''
                }))}
                onChange={(e) => setSelectedPropertyId(Number(e.target.value))}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No properties assigned
              </Typography>
            )}

            {/* Date Picker */}
            <AssetDatePicker
              label={t('cleaning:date')}
              value={date}
              onChange={(value) => setDate(value ? value.toDate() : null)}
            />

            {/* Percentage Field */}
            <AssetNumberField
              label={t('cleaning:percentage')}
              value={percentage}
              adornment="%"
              onChange={(e) => setPercentage(e.target.value === '' ? '' : Number(e.target.value))}
            />

            {/* Calculated Amount Display */}
            {selectedProperty?.cleaningBruttoPrice && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('cleaning:bruttoPrice')}: {t('format.currency.euro', { val: selectedProperty.cleaningBruttoPrice })}
                </Typography>
                <Typography variant="h6">
                  {t('cleaning:amount')}: {t('format.currency.euro', { val: calculatedAmount })}
                </Typography>
              </Box>
            )}

            {/* Save Button */}
            <AssetButton
              label={t('cleaning:save')}
              variant="contained"
              onClick={handleSave}
              disabled={!selectedPropertyId || !date}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Cleaning History Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('cleaning:myCleaningHistory')}
          </Typography>

          <AssetDataTable<CleaningRow>
            t={t}
            data={cleaningRows}
            fields={fields}
            onDeleteRequest={handleDelete}
            sortable
          />
        </CardContent>
      </Card>
    </Box>
  );
}

export default CleanerDashboard;
