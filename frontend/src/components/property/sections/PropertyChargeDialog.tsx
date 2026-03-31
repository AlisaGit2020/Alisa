import { Box, CircularProgress, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PropertyCharge, PropertyChargeInput } from '@asset-types';
import ApiClient from '@asset-lib/api-client';
import AssetDialog from '../../asset/dialog/AssetDialog';
import AssetConfirmDialog from '../../asset/dialog/AssetConfirmDialog';
import AssetButton from '../../asset/form/AssetButton';
import AssetDataTable, { AssetDataTableField } from '../../asset/datatable/AssetDataTable';
import PropertyChargeForm from './PropertyChargeForm';

interface PropertyChargeDialogProps {
  open: boolean;
  propertyId: number;
  onClose: () => void;
  onChargesUpdated?: () => void;
}

function PropertyChargeDialog({
  open,
  propertyId,
  onClose,
  onChargesUpdated,
}: PropertyChargeDialogProps) {
  const { t } = useTranslation('property');
  const [charges, setCharges] = useState<PropertyCharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCharge, setEditingCharge] = useState<PropertyCharge | undefined>(undefined);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [chargeToDelete, setChargeToDelete] = useState<PropertyCharge | null>(null);

  const fetchCharges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.request<PropertyCharge[]>({
        method: 'GET',
        url: `/real-estate/property/${propertyId}/charges`,
      });
      setCharges(data);
    } catch {
      setError(t('report.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [propertyId, t]);

  useEffect(() => {
    if (open) {
      fetchCharges();
    }
  }, [open, fetchCharges]);

  const handleAdd = () => {
    setEditingCharge(undefined);
    setShowForm(true);
  };

  const handleEdit = (id: number) => {
    const charge = charges.find(c => c.id === id);
    if (charge) {
      setEditingCharge(charge);
      setShowForm(true);
    }
  };

  const handleDeleteRequest = (id: number) => {
    const charge = charges.find(c => c.id === id);
    if (charge) {
      setChargeToDelete(charge);
      setDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!chargeToDelete) return;

    try {
      await ApiClient.request({
        method: 'DELETE',
        url: `/real-estate/property/${propertyId}/charges/${chargeToDelete.id}`,
      });
      await fetchCharges();
      onChargesUpdated?.();
    } catch {
      setError(t('report.fetchError'));
    } finally {
      setDeleteConfirmOpen(false);
      setChargeToDelete(null);
    }
  };

  const handleFormSubmit = async (input: PropertyChargeInput) => {
    try {
      if (input.id) {
        await ApiClient.request({
          method: 'PUT',
          url: `/real-estate/property/${propertyId}/charges/${input.id}`,
          data: input,
        });
      } else {
        await ApiClient.request({
          method: 'POST',
          url: `/real-estate/property/${propertyId}/charges`,
          data: input,
        });
      }
      setShowForm(false);
      await fetchCharges();
      onChargesUpdated?.();
    } catch {
      setError(t('report.fetchError'));
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCharge(undefined);
  };

  const fields: AssetDataTableField<PropertyCharge>[] = [
    {
      name: 'typeName',
      label: t('chargeType'),
      render: (charge) => t(`chargeTypes.${charge.typeName}`),
    },
    {
      name: 'amount',
      label: t('chargeAmount'),
      format: 'currency',
    },
    {
      name: 'startDate',
      label: t('startDate'),
      format: 'date',
    },
    {
      name: 'endDate',
      label: t('endDate'),
      render: (charge) => charge.endDate
        ? t('format.date', {
            val: new Date(charge.endDate),
            formatParams: { val: { year: 'numeric', month: 'numeric', day: 'numeric' } },
          })
        : t('validUntilFurtherNotice'),
    },
  ];

  if (!open) {
    return null;
  }

  return (
    <>
      <AssetDialog
        open={open}
        onClose={onClose}
        title={t('chargeHistory')}
        maxWidth="md"
        fullWidth
        actions={
          <AssetButton label={t('close')} variant="outlined" onClick={onClose} />
        }
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress role="progressbar" />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && !showForm && (
          <AssetDataTable<PropertyCharge>
            t={t}
            data={charges}
            fields={fields}
            onNewRow={handleAdd}
            onEdit={handleEdit}
            onDeleteRequest={handleDeleteRequest}
          />
        )}

        {showForm && (
          <PropertyChargeForm
            propertyId={propertyId}
            charge={editingCharge}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}
      </AssetDialog>

      <AssetConfirmDialog
        open={deleteConfirmOpen}
        title={t('deleteCharge')}
        message={t('confirmDeleteCharge')}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setChargeToDelete(null);
        }}
      />
    </>
  );
}

export default PropertyChargeDialog;
