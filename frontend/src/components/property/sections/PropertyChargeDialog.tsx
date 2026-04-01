import { Alert, Box, CircularProgress, Collapse } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChargeType, PropertyCharge, PropertyChargeInput } from '@asset-types';
import ApiClient from '@asset-lib/api-client';
import AssetDialog from '../../asset/dialog/AssetDialog';
import AssetConfirmDialog from '../../asset/dialog/AssetConfirmDialog';
import AssetButton from '../../asset/form/AssetButton';
import SeasonCard from './SeasonCard';
import SeasonChargeForm from './SeasonChargeForm';

interface PropertyChargeDialogProps {
  open: boolean;
  propertyId: number;
  onClose: () => void;
  onChargesUpdated?: () => void;
}

interface Season {
  startDate: string;
  endDate: string | null;
  charges: PropertyCharge[];
  isActive: boolean;
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
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [deletingSeason, setDeletingSeason] = useState<Season | null>(null);

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
      setShowForm(false);
    }
  }, [open, fetchCharges]);

  // Group charges into seasons by startDate
  const seasons = useMemo(() => {
    const seasonMap = new Map<string, Season>();

    for (const charge of charges) {
      const key = charge.startDate;
      if (!seasonMap.has(key)) {
        seasonMap.set(key, {
          startDate: charge.startDate,
          endDate: charge.endDate,
          charges: [],
          isActive: charge.endDate === null,
        });
      }
      seasonMap.get(key)!.charges.push(charge);
    }

    // Sort by startDate descending (newest first)
    return Array.from(seasonMap.values()).sort((a, b) =>
      b.startDate.localeCompare(a.startDate)
    );
  }, [charges]);

  // Current season (no endDate)
  const currentSeason = useMemo(() =>
    seasons.find(s => s.isActive),
    [seasons]
  );

  // Past seasons (have endDate)
  const pastSeasons = useMemo(() =>
    seasons.filter(s => !s.isActive),
    [seasons]
  );

  const handleFormSubmit = async (inputs: PropertyChargeInput[]) => {
    try {
      await ApiClient.request({
        method: 'POST',
        url: `/real-estate/property/${propertyId}/charges/batch`,
        data: inputs,
      });
      setShowForm(false);
      await fetchCharges();
      onChargesUpdated?.();
    } catch {
      setError(t('report.fetchError'));
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSeason(null);
  };

  const handleEditSeason = (season: Season) => {
    setEditingSeason(season);
    setShowForm(true);
  };

  const handleDeleteSeason = async () => {
    if (!deletingSeason) return;

    try {
      // Delete all charges in this season
      for (const charge of deletingSeason.charges) {
        await ApiClient.request({
          method: 'DELETE',
          url: `/real-estate/property/${propertyId}/charges/${charge.id}`,
        });
      }
      setDeletingSeason(null);
      await fetchCharges();
      onChargesUpdated?.();
    } catch {
      setError(t('report.fetchError'));
      setDeletingSeason(null);
    }
  };

  // Convert season to initial values for the form
  const getInitialValues = (season: Season) => {
    const getAmount = (type: ChargeType) =>
      season.charges.find(c => c.chargeType === type)?.amount ?? 0;

    return {
      maintenanceFee: getAmount(ChargeType.MAINTENANCE_FEE),
      financialCharge: getAmount(ChargeType.FINANCIAL_CHARGE),
      waterPrepayment: getAmount(ChargeType.WATER_PREPAYMENT),
      otherChargeBased: getAmount(ChargeType.OTHER_CHARGE_BASED),
      startDate: season.startDate,
      endDate: season.endDate,
    };
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
      maxWidth="sm"
      fullWidth
      actions={
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', px: 2 }}>
          <AssetButton label={t('close')} variant="outlined" onClick={onClose} />
        </Box>
      }
    >
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress role="progressbar" />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {/* Form view */}
          {showForm ? (
            <SeasonChargeForm
              propertyId={propertyId}
              initialValues={editingSeason ? getInitialValues(editingSeason) : undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          ) : (
            <>
              {/* Current season card */}
              {currentSeason && (
                <Box sx={{ mb: 2 }}>
                  <SeasonCard
                    charges={currentSeason.charges}
                    startDate={currentSeason.startDate}
                    endDate={currentSeason.endDate}
                    isActive={currentSeason.isActive}
                    onEdit={() => handleEditSeason(currentSeason)}
                    onDelete={() => setDeletingSeason(currentSeason)}
                  />
                </Box>
              )}

              {/* Add new season button */}
              <AssetButton
                label={t('addNewSeason')}
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setShowForm(true)}
                fullWidth
                sx={{
                  mb: 2,
                  py: 1.5,
                  borderStyle: 'dashed',
                }}
              />

              {/* History section */}
              {pastSeasons.length > 0 && (
                <>
                  <AssetButton
                    label={showAllHistory ? t('hideHistory') : t('showHistory')}
                    variant="text"
                    onClick={() => setShowAllHistory(prev => !prev)}
                    endIcon={showAllHistory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    fullWidth
                    sx={{ mb: 1, color: 'text.secondary' }}
                  />

                  <Collapse in={showAllHistory}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {pastSeasons.map((season) => (
                        <SeasonCard
                          key={season.startDate}
                          charges={season.charges}
                          startDate={season.startDate}
                          endDate={season.endDate}
                          isActive={season.isActive}
                          onEdit={() => handleEditSeason(season)}
                          onDelete={() => setDeletingSeason(season)}
                        />
                      ))}
                    </Box>
                  </Collapse>
                </>
              )}
            </>
          )}
        </>
      )}
    </AssetDialog>

      {/* Delete confirmation dialog */}
      <AssetConfirmDialog
        open={!!deletingSeason}
        title={t('deleteSeasonConfirmTitle')}
        contentText={t('deleteSeasonConfirmMessage')}
        buttonTextConfirm={t('delete')}
        buttonTextCancel={t('cancel')}
        onConfirm={handleDeleteSeason}
        onClose={() => setDeletingSeason(null)}
      />
    </>
  );
}

export default PropertyChargeDialog;
