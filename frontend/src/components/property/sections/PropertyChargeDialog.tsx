import { Box, CircularProgress, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { PropertyCharge, PropertyChargeInput } from '@asset-types';
import ApiClient from '@asset-lib/api-client';
import AssetDialog from '../../asset/dialog/AssetDialog';
import AssetConfirmDialog from '../../asset/dialog/AssetConfirmDialog';
import AssetButton from '../../asset/form/AssetButton';
import PropertyChargeForm from './PropertyChargeForm';
import { formatCurrency, formatDate } from '@asset-lib/format-utils';

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

  const fetchCharges = async () => {
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
  };

  useEffect(() => {
    if (open) {
      fetchCharges();
    }
  }, [open, propertyId]);

  const handleAdd = () => {
    setEditingCharge(undefined);
    setShowForm(true);
  };

  const handleEdit = (charge: PropertyCharge) => {
    setEditingCharge(charge);
    setShowForm(true);
  };

  const handleDelete = (charge: PropertyCharge) => {
    setChargeToDelete(charge);
    setDeleteConfirmOpen(true);
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
          <>
            <Box sx={{ mb: 2 }}>
              <AssetButton
                label={t('addCharge')}
                variant="contained"
                onClick={handleAdd}
              />
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('chargeType')}</TableCell>
                  <TableCell align="right">{t('chargeAmount')}</TableCell>
                  <TableCell>{t('startDate')}</TableCell>
                  <TableCell>{t('endDate')}</TableCell>
                  <TableCell align="center">{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {charges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>{t(`chargeTypes.${charge.typeName}`)}</TableCell>
                    <TableCell align="right">{formatCurrency(charge.amount)}</TableCell>
                    <TableCell>{formatDate(charge.startDate)}</TableCell>
                    <TableCell>
                      {charge.endDate
                        ? formatDate(charge.endDate)
                        : t('validUntilFurtherNotice')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(charge)}
                        aria-label={t('editCharge')}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(charge)}
                        aria-label={t('deleteCharge')}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {charges.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      {t('noCharges')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </>
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