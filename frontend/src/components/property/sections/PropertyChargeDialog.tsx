import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChargeType, PropertyCharge, PropertyChargeInput } from '@asset-types';
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

const CHARGE_TYPES = [
  { typeName: 'maintenance-fee', chargeType: ChargeType.MAINTENANCE_FEE },
  { typeName: 'financial-charge', chargeType: ChargeType.FINANCIAL_CHARGE },
  { typeName: 'water-prepayment', chargeType: ChargeType.WATER_PREPAYMENT },
  { typeName: 'total-charge', chargeType: ChargeType.TOTAL_CHARGE },
];

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
  const [selectedChargeType, setSelectedChargeType] = useState<ChargeType | undefined>(undefined);
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

  // Group charges by type
  const chargesByType = useMemo(() => {
    const grouped = new Map<string, PropertyCharge[]>();
    for (const { typeName } of CHARGE_TYPES) {
      grouped.set(typeName, []);
    }
    for (const charge of charges) {
      const existing = grouped.get(charge.typeName) || [];
      existing.push(charge);
      grouped.set(charge.typeName, existing);
    }
    return grouped;
  }, [charges]);

  // Check if total charge matches sum of components
  const totalMismatch = useMemo(() => {
    const getActiveAmount = (typeName: string): number => {
      const typeCharges = chargesByType.get(typeName) || [];
      const activeCharge = typeCharges.find(c => !c.endDate);
      return activeCharge?.amount ?? 0;
    };

    const maintenanceFee = getActiveAmount('maintenance-fee');
    const financialCharge = getActiveAmount('financial-charge');
    const waterPrepayment = getActiveAmount('water-prepayment');
    const totalCharge = getActiveAmount('total-charge');

    const calculatedSum = maintenanceFee + financialCharge + waterPrepayment;

    if (totalCharge > 0 && Math.abs(calculatedSum - totalCharge) > 0.01) {
      return { calculatedSum, totalCharge };
    }
    return null;
  }, [chargesByType]);

  const handleAdd = (chargeType: ChargeType) => {
    setEditingCharge(undefined);
    setSelectedChargeType(chargeType);
    setShowForm(true);
  };

  const handleEdit = (id: number) => {
    const charge = charges.find(c => c.id === id);
    if (charge) {
      setEditingCharge(charge);
      setSelectedChargeType(undefined);
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
      setSelectedChargeType(undefined);
      await fetchCharges();
      onChargesUpdated?.();
    } catch {
      setError(t('report.fetchError'));
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCharge(undefined);
    setSelectedChargeType(undefined);
  };

  const fields: AssetDataTableField<PropertyCharge>[] = [
    {
      name: 'startDate',
      label: t('startDate'),
      format: 'date',
      width: '25%',
    },
    {
      name: 'endDate',
      label: t('endDate'),
      width: '35%',
      render: (charge) => charge.endDate
        ? t('format.date', {
            val: new Date(charge.endDate),
            formatParams: { val: { year: 'numeric', month: 'numeric', day: 'numeric' } },
          })
        : t('validUntilFurtherNotice'),
    },
    {
      name: 'amount',
      label: t('chargeAmount'),
      format: 'currency',
      width: '25%',
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

        {!loading && !showForm && totalMismatch && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('totalChargeMismatch', {
              calculated: totalMismatch.calculatedSum.toFixed(2),
              actual: totalMismatch.totalCharge.toFixed(2),
            })}
          </Alert>
        )}

        {!loading && !error && !showForm && (
          <>
            {CHARGE_TYPES.map(({ typeName, chargeType }) => {
              const typeCharges = chargesByType.get(typeName) || [];
              return (
                <Box key={typeName} sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {t(`chargeTypes.${typeName}`)}
                  </Typography>
                  <AssetDataTable<PropertyCharge>
                    t={t}
                    data={typeCharges}
                    fields={fields}
                    onNewRow={() => handleAdd(chargeType)}
                    onEdit={handleEdit}
                    onDeleteRequest={handleDeleteRequest}
                    fixedLayout
                    stripedRows={false}
                    rowHighlight={(charge) => !charge.endDate ? 'success.light' : undefined}
                  />
                </Box>
              );
            })}
          </>
        )}

        {showForm && (
          <PropertyChargeForm
            propertyId={propertyId}
            charge={editingCharge}
            defaultChargeType={selectedChargeType}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}
      </AssetDialog>

      <AssetConfirmDialog
        open={deleteConfirmOpen}
        title={t('deleteCharge')}
        contentText={t('confirmDeleteCharge')}
        buttonTextCancel={t('cancel')}
        buttonTextConfirm={t('delete')}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setChargeToDelete(null);
        }}
      />
    </>
  );
}

export default PropertyChargeDialog;
