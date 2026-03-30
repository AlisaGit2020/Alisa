import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AssetDialog, AssetButton } from '../asset';
import ApiClient from '@asset-lib/api-client';
import { VITE_API_URL } from '../../constants';
import { TaxDeductionType } from '../../types/common';
import { TaxDeductionCalculation, TaxDeductionMetadata } from '../../types/entities';
import { TaxDeductionInput } from '../../types/inputs';
import TravelDeductionForm from './TravelDeductionForm';
import LaundryDeductionForm from './LaundryDeductionForm';
import CustomDeductionForm from './CustomDeductionForm';

interface TaxDeductionDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  propertyId: number;
  year: number;
  deductionType: TaxDeductionType;
}

function TaxDeductionDialog({
  open,
  onClose,
  onSaved,
  propertyId,
  year,
  deductionType,
}: TaxDeductionDialogProps) {
  const { t } = useTranslation('tax');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculation, setCalculation] = useState<TaxDeductionCalculation | null>(null);

  // Form state
  const [distanceKm, setDistanceKm] = useState(0);
  const [visits, setVisits] = useState(0);
  const [ratePerKm, setRatePerKm] = useState(0.30);
  const [pricePerLaundry, setPricePerLaundry] = useState(3.0);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (open && (deductionType === TaxDeductionType.TRAVEL || deductionType === TaxDeductionType.LAUNDRY)) {
      loadCalculation();
    } else if (open) {
      setLoading(false);
    }
  }, [open, propertyId, year, deductionType]);

  const loadCalculation = async () => {
    setLoading(true);
    try {
      const response = await axios.get<TaxDeductionCalculation>(
        `${VITE_API_URL}/real-estate/property/tax/deductions/calculate?propertyId=${propertyId}&year=${year}`,
        await ApiClient.getOptions()
      );
      setCalculation(response.data);
      setDistanceKm(response.data.distanceKm ?? 0);
      setVisits(response.data.visits);
      setRatePerKm(response.data.ratePerKm);
      setPricePerLaundry(response.data.defaultLaundryPrice);
    } catch (err) {
      console.error('Failed to load calculation', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let inputAmount = 0;
      let metadata: TaxDeductionMetadata | undefined;
      let desc: string | undefined;

      if (deductionType === TaxDeductionType.TRAVEL && calculation) {
        const roundTrip = distanceKm * 2;
        inputAmount = roundTrip * visits * ratePerKm;
        metadata = {
          distanceKm,
          visits,
          ratePerKm,
        };
      } else if (deductionType === TaxDeductionType.LAUNDRY && calculation) {
        inputAmount = visits * pricePerLaundry;
        metadata = {
          visits,
          pricePerLaundry,
        };
      } else {
        inputAmount = amount;
        desc = description;
      }

      const input: TaxDeductionInput = {
        propertyId,
        year,
        deductionType,
        description: desc,
        amount: inputAmount,
        metadata,
      };

      await axios.post(
        `${VITE_API_URL}/real-estate/property/tax/deductions`,
        input,
        await ApiClient.getOptions()
      );

      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save deduction', err);
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    switch (deductionType) {
      case TaxDeductionType.TRAVEL:
        return t('travelDeductionTitle');
      case TaxDeductionType.LAUNDRY:
        return t('laundryDeductionTitle');
      default:
        return t('customDeductionTitle');
    }
  };

  const canSave = () => {
    if (deductionType === TaxDeductionType.CUSTOM) {
      return description.trim() !== '' && amount > 0;
    }
    return true;
  };

  return (
    <AssetDialog
      open={open}
      onClose={onClose}
      title={`${getTitle()} - ${year}`}
      maxWidth="sm"
      actions={
        <>
          <AssetButton label={t('common:cancel')} onClick={onClose} />
          <AssetButton
            label={t('addDeduction')}
            variant="contained"
            onClick={handleSave}
            loading={saving}
            disabled={!canSave()}
          />
        </>
      }
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ pt: 1 }}>
          {calculation && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {calculation.propertyName}
            </Typography>
          )}

          {deductionType === TaxDeductionType.TRAVEL && calculation && (
            <TravelDeductionForm
              calculation={calculation}
              distanceKm={distanceKm}
              visits={visits}
              ratePerKm={ratePerKm}
              onDistanceChange={setDistanceKm}
              onVisitsChange={setVisits}
              onRateChange={setRatePerKm}
            />
          )}

          {deductionType === TaxDeductionType.LAUNDRY && calculation && (
            <LaundryDeductionForm
              calculation={calculation}
              visits={visits}
              pricePerLaundry={pricePerLaundry}
              onVisitsChange={setVisits}
              onPriceChange={setPricePerLaundry}
            />
          )}

          {deductionType === TaxDeductionType.CUSTOM && (
            <CustomDeductionForm
              description={description}
              amount={amount}
              onDescriptionChange={setDescription}
              onAmountChange={setAmount}
            />
          )}
        </Box>
      )}
    </AssetDialog>
  );
}

export default TaxDeductionDialog;
